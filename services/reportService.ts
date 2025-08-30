
import { SavedReport, User } from '../types';

const getNewReportKey = (userId: string): string => `dailyReport_${userId}_${Date.now()}`;

// Helper to compare dates while ignoring time and timezone.
const areDatesEqual = (date1: string, date2: string): boolean => {
    return date1.split('T')[0] === date2.split('T')[0];
};

export const reportService = {
  async getReports(user: User, isMasterUser: boolean): Promise<SavedReport[]> {
    const reports: SavedReport[] = [];
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dailyReport_')) {
        try {
            const isOwner = key.startsWith(`dailyReport_${user.id}_`);

            if (isMasterUser || isOwner) {
                const item = localStorage.getItem(key);
                if (item) {
                    const reportData: { date: string, text: string, userId: string } = JSON.parse(item);
                    const reportDate = new Date(reportData.date);

                    if (reportDate >= oneMonthAgo) {
                        reports.push({ key, ...reportData });
                    }
                }
            }
        } catch (error) {
          console.error(`Failed to parse report from localStorage with key: ${key}`, error);
        }
      }
    }
    
    reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return reports;
  },

  async saveReport(userId: string, report: { date: string, text: string }): Promise<SavedReport> {
    const key = getNewReportKey(userId);
    const dataToSave = {
      ...report,
      userId,
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
    return { key, ...dataToSave };
  },
  
  async updateReport(reportKey: string, report: { date: string, text: string, userId: string }): Promise<SavedReport> {
    localStorage.setItem(reportKey, JSON.stringify(report));
    return { key: reportKey, ...report };
  },

  async deleteReport(reportKey: string): Promise<void> {
    localStorage.removeItem(reportKey);
  },
  
  async checkDateConflict(userId: string, dateToCheck: string, currentReportKey: string | null): Promise<SavedReport | null> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Ensure we are only checking the user's reports and not the one currently being edited
      if (key && key.startsWith(`dailyReport_${userId}_`) && key !== currentReportKey) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const reportData: { date: string, text: string, userId: string } = JSON.parse(item);
            if (areDatesEqual(reportData.date, dateToCheck)) {
              return { key, ...reportData }; // Conflict found
            }
          }
        } catch (error) {
          console.error(`Error checking date conflict for key ${key}:`, error);
        }
      }
    }
    return null; // No conflict
  },
};
