import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import * as XLSX from "xlsx";
import { storage } from "./storage";
import { 
  insertShiftSchema, 
  insertPunchRecordSchema, 
  insertProcessedRecordSchema,
  insertProcessingSettingsSchema,
  type ProcessingProgress,
  type ProcessingStats,
  type ExportOptions
} from "@shared/schema";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

// WebSocket connection management
const wsConnections = new Map<string, WebSocket>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    const sessionId = req.url?.split('sessionId=')[1] || 'default';
    wsConnections.set(sessionId, ws);
    
    ws.on('close', () => {
      wsConnections.delete(sessionId);
    });
  });

  // Utility function to send WebSocket message
  const sendProgressUpdate = (sessionId: string, progress: ProcessingProgress) => {
    const ws = wsConnections.get(sessionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'progress', data: progress }));
    }
  };

  // Shift management endpoints
  app.get("/api/shifts/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const shifts = await storage.getShifts(sessionId);
      res.json(shifts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shifts" });
    }
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      const shiftData = insertShiftSchema.parse(req.body);
      const shift = await storage.createShift(shiftData);
      res.json(shift);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid shift data" });
    }
  });

  app.put("/api/shifts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const shiftData = insertShiftSchema.partial().parse(req.body);
      const shift = await storage.updateShift(parseInt(id), shiftData);
      res.json(shift);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid shift data" });
    }
  });

  app.delete("/api/shifts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShift(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shift" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", upload.single('file'), async (req: Request & { file?: Express.Multer.File }, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      // Clear previous session data
      await storage.clearSession(sessionId);

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      // Validate and transform data
      const punchRecords = data.map((row: any) => ({
        employeeId: String(row['Employee ID'] || ''),
        firstName: String(row['First Name'] || ''),
        department: String(row['Department'] || ''),
        date: String(row['Date'] || ''),
        time: String(row['Time'] || ''),
        punchState: String(row['Punch State'] || ''),
        sessionId,
      }));

      // Save to storage
      const savedRecords = await storage.savePunchRecords(punchRecords);
      
      res.json({ 
        success: true, 
        recordCount: savedRecords.length,
        records: savedRecords 
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process file" });
    }
  });

  // Processing endpoint
  app.post("/api/process", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID is required" });
      }

      // Get punch records and shifts
      const punchRecords = await storage.getPunchRecords(sessionId);
      const shifts = await storage.getShifts(sessionId);
      const settings = await storage.getProcessingSettings(sessionId);
      const gracePeriod = settings?.gracePeriodMinutes || 15;

      if (punchRecords.length === 0) {
        return res.status(400).json({ error: "No punch records found" });
      }

      // Process records with progress updates
      const processedRecords = [];
      const total = punchRecords.length;
      
      // Group punch records by employee and date
      const groupedRecords = new Map<string, any[]>();
      for (const record of punchRecords) {
        const key = `${record.employeeId}-${record.date}`;
        if (!groupedRecords.has(key)) {
          groupedRecords.set(key, []);
        }
        groupedRecords.get(key)!.push(record);
      }

      let processed = 0;
      for (const [key, records] of Array.from(groupedRecords.entries())) {
        const checkIns = records.filter((r: any) => r.punchState === 'Check In');
        const checkOuts = records.filter((r: any) => r.punchState === 'Check Out');

        for (const checkIn of checkIns) {
          const matchingCheckOut = checkOuts.find((co: any) => 
            co.employeeId === checkIn.employeeId && 
            co.date === checkIn.date
          );

          // Find matching shift
          const matchedShift = findMatchingShift(checkIn, shifts, gracePeriod);
          
          const processedRecord = {
            employeeId: checkIn.employeeId,
            firstName: checkIn.firstName,
            department: checkIn.department,
            date: checkIn.date,
            shiftCode: matchedShift?.shift?.code || null,
            shiftStartDateTime: matchedShift?.shift ? 
              `${checkIn.date} ${matchedShift.shift.startTime}` : null,
            shiftEndDateTime: matchedShift?.shift ? 
              calculateShiftEndDateTime(checkIn.date, matchedShift.shift.startTime, matchedShift.shift.endTime, matchedShift.shift.isOvernight) : null,
            actualCheckIn: `${checkIn.date} ${checkIn.time}`,
            actualCheckOut: matchingCheckOut ? `${matchingCheckOut.date} ${matchingCheckOut.time}` : null,
            status: matchedShift?.status || 'Unmatched',
            sessionId,
          };

          processedRecords.push(processedRecord);
          processed++;

          // Send progress update
          const progress: ProcessingProgress = {
            current: processed,
            total,
            message: `Processing ${checkIn.firstName} (${checkIn.employeeId})...`,
            percentage: Math.round((processed / total) * 100),
          };
          sendProgressUpdate(sessionId, progress);
        }
      }

      // Save processed records
      await storage.saveProcessedRecords(processedRecords);

      // Calculate stats
      const stats: ProcessingStats = {
        total: processedRecords.length,
        matched: processedRecords.filter(r => r.status === 'On-Time').length,
        late: processedRecords.filter(r => r.status === 'Late').length,
        unmatched: processedRecords.filter(r => r.status === 'Unmatched').length,
      };

      res.json({ success: true, stats, processedRecords });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process data" });
    }
  });

  // Get processed records
  app.get("/api/processed-records/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const records = await storage.getProcessedRecords(sessionId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch processed records" });
    }
  });

  // Update processed record
  app.put("/api/processed-records/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const record = await storage.updateProcessedRecord(parseInt(id), updateData);
      res.json(record);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update record" });
    }
  });

  // Processing settings
  app.get("/api/settings/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const settings = await storage.getProcessingSettings(sessionId);
      res.json(settings || { gracePeriodMinutes: 15 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const settingsData = insertProcessingSettingsSchema.parse(req.body);
      const settings = await storage.saveProcessingSettings(settingsData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid settings data" });
    }
  });

  // Export endpoint
  app.post("/api/export", async (req, res) => {
    try {
      const { sessionId, options }: { sessionId: string; options: ExportOptions } = req.body;
      
      const processedRecords = await storage.getProcessedRecords(sessionId);
      
      if (options.format === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(processedRecords);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Processed Records');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="processed-punch-data-${Date.now()}.xlsx"`);
        res.send(buffer);
      } else if (options.format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(processedRecords));
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="processed-punch-data-${Date.now()}.csv"`);
        res.send(csv);
      } else {
        res.status(400).json({ error: "Unsupported export format" });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to export data" });
    }
  });

  return httpServer;
}

// Helper functions
function findMatchingShift(checkIn: any, shifts: any[], gracePeriod: number) {
  const checkInTime = timeToMinutes(checkIn.time);
  let bestMatch = null;
  let bestScore = Infinity;

  for (const shift of shifts) {
    const shiftStart = timeToMinutes(shift.startTime);
    const gracePeriodEnd = shiftStart + gracePeriod;
    
    let timeDiff;
    if (shift.isOvernight) {
      // Handle overnight shifts
      if (checkInTime >= shiftStart) {
        timeDiff = checkInTime - shiftStart;
      } else {
        timeDiff = (24 * 60 - shiftStart) + checkInTime;
      }
    } else {
      timeDiff = checkInTime - shiftStart;
    }

    if (timeDiff >= 0 && timeDiff < bestScore) {
      bestScore = timeDiff;
      bestMatch = {
        shift,
        status: timeDiff <= gracePeriod ? 'On-Time' : 'Late'
      };
    }
  }

  return bestMatch;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateShiftEndDateTime(date: string, startTime: string, endTime: string, isOvernight: boolean): string {
  if (isOvernight) {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return `${nextDay.toISOString().split('T')[0]} ${endTime}`;
  }
  return `${date} ${endTime}`;
}
