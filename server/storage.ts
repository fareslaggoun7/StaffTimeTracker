import { 
  Shift, 
  InsertShift, 
  PunchRecord, 
  InsertPunchRecord, 
  ProcessedRecord, 
  InsertProcessedRecord,
  ProcessingSettings,
  InsertProcessingSettings
} from "@shared/schema";

export interface IStorage {
  // Shift management
  getShifts(sessionId: string): Promise<Shift[]>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: number, shift: Partial<InsertShift>): Promise<Shift>;
  deleteShift(id: number): Promise<void>;
  
  // Punch records
  savePunchRecords(records: InsertPunchRecord[]): Promise<PunchRecord[]>;
  getPunchRecords(sessionId: string): Promise<PunchRecord[]>;
  
  // Processed records
  saveProcessedRecords(records: InsertProcessedRecord[]): Promise<ProcessedRecord[]>;
  getProcessedRecords(sessionId: string): Promise<ProcessedRecord[]>;
  updateProcessedRecord(id: number, record: Partial<InsertProcessedRecord>): Promise<ProcessedRecord>;
  
  // Processing settings
  getProcessingSettings(sessionId: string): Promise<ProcessingSettings | undefined>;
  saveProcessingSettings(settings: InsertProcessingSettings): Promise<ProcessingSettings>;
  
  // Session management
  clearSession(sessionId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private shifts: Map<number, Shift> = new Map();
  private punchRecords: Map<number, PunchRecord> = new Map();
  private processedRecords: Map<number, ProcessedRecord> = new Map();
  private processingSettings: Map<number, ProcessingSettings> = new Map();
  private currentShiftId = 1;
  private currentPunchRecordId = 1;
  private currentProcessedRecordId = 1;
  private currentSettingsId = 1;

  constructor() {
    // Initialize with default shifts
    this.createShift({
      code: "Night Shift",
      startTime: "20:00",
      endTime: "06:00",
      sessionId: "default"
    });
    
    this.createShift({
      code: "Day Shift",
      startTime: "08:00",
      endTime: "17:00",
      sessionId: "default"
    });
  }

  async getShifts(sessionId: string): Promise<Shift[]> {
    return Array.from(this.shifts.values()).filter(shift => 
      shift.sessionId === sessionId || shift.sessionId === "default"
    );
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const id = this.currentShiftId++;
    const newShift: Shift = {
      ...shift,
      id,
      isOvernight: this.isOvernightShift(shift.startTime, shift.endTime),
      createdAt: new Date(),
    };
    this.shifts.set(id, newShift);
    return newShift;
  }

  async updateShift(id: number, shift: Partial<InsertShift>): Promise<Shift> {
    const existing = this.shifts.get(id);
    if (!existing) throw new Error("Shift not found");
    
    const updated: Shift = {
      ...existing,
      ...shift,
      isOvernight: shift.startTime && shift.endTime ? 
        this.isOvernightShift(shift.startTime, shift.endTime) : 
        existing.isOvernight,
    };
    this.shifts.set(id, updated);
    return updated;
  }

  async deleteShift(id: number): Promise<void> {
    this.shifts.delete(id);
  }

  async savePunchRecords(records: InsertPunchRecord[]): Promise<PunchRecord[]> {
    const savedRecords: PunchRecord[] = [];
    for (const record of records) {
      const id = this.currentPunchRecordId++;
      const newRecord: PunchRecord = {
        ...record,
        id,
        createdAt: new Date(),
      };
      this.punchRecords.set(id, newRecord);
      savedRecords.push(newRecord);
    }
    return savedRecords;
  }

  async getPunchRecords(sessionId: string): Promise<PunchRecord[]> {
    return Array.from(this.punchRecords.values()).filter(record => 
      record.sessionId === sessionId
    );
  }

  async saveProcessedRecords(records: InsertProcessedRecord[]): Promise<ProcessedRecord[]> {
    const savedRecords: ProcessedRecord[] = [];
    for (const record of records) {
      const id = this.currentProcessedRecordId++;
      const newRecord: ProcessedRecord = {
        ...record,
        id,
        shiftCode: record.shiftCode || null,
        shiftStartDateTime: record.shiftStartDateTime || null,
        shiftEndDateTime: record.shiftEndDateTime || null,
        actualCheckIn: record.actualCheckIn || null,
        actualCheckOut: record.actualCheckOut || null,
        createdAt: new Date(),
      };
      this.processedRecords.set(id, newRecord);
      savedRecords.push(newRecord);
    }
    return savedRecords;
  }

  async getProcessedRecords(sessionId: string): Promise<ProcessedRecord[]> {
    return Array.from(this.processedRecords.values()).filter(record => 
      record.sessionId === sessionId
    );
  }

  async updateProcessedRecord(id: number, record: Partial<InsertProcessedRecord>): Promise<ProcessedRecord> {
    const existing = this.processedRecords.get(id);
    if (!existing) throw new Error("Processed record not found");
    
    const updated: ProcessedRecord = { ...existing, ...record };
    this.processedRecords.set(id, updated);
    return updated;
  }

  async getProcessingSettings(sessionId: string): Promise<ProcessingSettings | undefined> {
    return Array.from(this.processingSettings.values()).find(settings => 
      settings.sessionId === sessionId
    );
  }

  async saveProcessingSettings(settings: InsertProcessingSettings): Promise<ProcessingSettings> {
    const id = this.currentSettingsId++;
    const newSettings: ProcessingSettings = {
      ...settings,
      id,
      gracePeriodMinutes: settings.gracePeriodMinutes || 15,
      createdAt: new Date(),
    };
    this.processingSettings.set(id, newSettings);
    return newSettings;
  }

  async clearSession(sessionId: string): Promise<void> {
    // Remove all records for this session
    Array.from(this.punchRecords.entries()).forEach(([id, record]) => {
      if (record.sessionId === sessionId) {
        this.punchRecords.delete(id);
      }
    });
    
    Array.from(this.processedRecords.entries()).forEach(([id, record]) => {
      if (record.sessionId === sessionId) {
        this.processedRecords.delete(id);
      }
    });
    
    Array.from(this.processingSettings.entries()).forEach(([id, settings]) => {
      if (settings.sessionId === sessionId) {
        this.processingSettings.delete(id);
      }
    });
  }

  private isOvernightShift(startTime: string, endTime: string): boolean {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    return end < start;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export const storage = new MemStorage();
