import React, { useState, useEffect } from 'react';
import { Page } from '../App';
import { EditIcon } from '../components/EditIcon';
import { TrashIcon } from '../components/TrashIcon';
import { SavedReport, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { reportService } from '../services/reportService';
import { userService } from '../services/userService';
import { ArrowLeftIcon } from '../components/ArrowLeftIcon';
import { DownloadIcon } from '../components/DownloadIcon';
import { ChevronDownIcon } from '../components/ChevronDownIcon';

interface SavedReportsProps {
  navigateTo: (page: Page) => void;
  onEditReport: (report: SavedReport) => void;
}

const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};

const SavedReports: React.FC<SavedReportsProps> = ({ navigateTo, onEditReport }) => {
  const { user, isMasterUser } = useAuth();
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reportToDelete, setReportToDelete] = useState<SavedReport | null>(null);
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  
  // State for master user UI enhancements
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const reports = await reportService.getReports(user, isMasterUser);
        setSavedReports(reports);
        
        if (isMasterUser) {
          const allUsers: User[] = await userService.getUsers();
          const newMap = new Map<string, string>();
          allUsers.forEach(u => newMap.set(u.id, u.name));
          setUserMap(newMap);
        }

      } catch (error) {
        console.error("Failed to load reports or users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, isMasterUser]);

  const handleDownloadReport = (report: SavedReport) => {
    try {
      const selectedDate = new Date(report.date);
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      const fileName = `Report ${day}-${month}-${year}.doc`;

      const formatTextForDoc = (text: string): string => {
        const lines = text.split('\n');
        return lines.map(line => {
          const style = `font-family:Calibri,sans-serif;font-size:11.0pt;`;
          if (line.trim() === '') return `<p style="margin:0;"><span style="${style}">&nbsp;</span></p>`;
          if (/^Report del/.test(line)) return `<p style="margin:0;"><span style="${style}"><b>${line}</b></span></p>`;
          
          const match = line.match(/^(Visita n°\d+:|Riassunto visita:|Obiettivo prox visita:|Prox visita entro:)/);
          if (match) {
            const prefix = match[0];
            const userText = line.substring(prefix.length);
            return `<p style="margin:0;"><span style="${style}"><b>${prefix}</b>${userText}</span></p>`;
          }
          
          return `<p style="margin:0;"><span style="${style}">${line}</span></p>`;
        }).join('');
      };
      
      const formattedContent = formatTextForDoc(report.text);
      const htmlString = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Report</title></head>
            <body><div>${formattedContent}</div></body>
          </html>`;

      const blob = new Blob([htmlString], { type: 'application/msword' }); 
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to save file:", error);
      alert("Errore durante il download del report.");
    }
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    try {
      await reportService.deleteReport(reportToDelete.key);
      setSavedReports(currentReports => currentReports.filter(report => report.key !== reportToDelete.key));
    } catch (error) {
      console.error("Failed to delete report:", error);
      alert("Errore durante l'eliminazione del report.");
    } finally {
      setReportToDelete(null); // Close modal
    }
  };
  
  const cancelDelete = () => {
      setReportToDelete(null);
  };
  
  const toggleAccordion = (userId: string) => {
    setOpenAccordions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
            newSet.delete(userId);
        } else {
            newSet.add(userId);
        }
        return newSet;
    });
  };

  const masterView = () => {
    const groupedReports = savedReports.reduce((acc, report) => {
      const userId = report.userId;
      if (!acc.has(userId)) {
        acc.set(userId, []);
      }
      acc.get(userId)!.push(report);
      return acc;
    }, new Map<string, SavedReport[]>());

    const filteredUserIds = Array.from(groupedReports.keys()).filter(userId => {
      const userName = userMap.get(userId) || userId;
      return userName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
      <>
        <div className="flex flex-col sm:flex-row gap-4 mb-6 px-8">
          <input
            type="text"
            placeholder="Cerca per utente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-2/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Cerca utente"
          />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="w-full sm:w-1/3 px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Ordina report"
          >
            <option value="newest">Più recenti</option>
            <option value="oldest">Meno recenti</option>
          </select>
        </div>
        <div className="space-y-2 max-h-[28rem] overflow-y-auto px-8 pb-8">
          {isLoading ? (
            <p className="text-center text-gray-500 py-8">Caricamento report...</p>
          ) : filteredUserIds.length > 0 ? (
            filteredUserIds.map(userId => {
              const reports = groupedReports.get(userId) || [];
              reports.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
              });
              const isOpen = openAccordions.has(userId);

              return (
                <div key={userId} className="rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => toggleAccordion(userId)}
                    className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
                  >
                    <span className="font-bold text-gray-800">{userMap.get(userId) || userId}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">{reports.length}</span>
                      <ChevronDownIcon className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="p-4 space-y-3 bg-white">
                      {reports.map(report => (
                         <div key={report.key} className="bg-gray-50 p-3 rounded-md border border-gray-200 flex justify-between items-center">
                           <div>
                             <h3 className="font-semibold text-gray-700">{formatDateForDisplay(report.date)}</h3>
                             <p className="text-sm text-gray-500 truncate max-w-xs">{report.text.split('\n')[2] || 'Nessun contenuto'}</p>
                           </div>
                           <div className="flex items-center gap-1">
                             <button onClick={() => handleDownloadReport(report)} className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors" aria-label="Scarica report">
                               <DownloadIcon />
                             </button>
                             <button onClick={() => onEditReport(report)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" aria-label="Modifica report">
                               <EditIcon />
                             </button>
                             <button onClick={() => setReportToDelete(report)} className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors" aria-label="Elimina report">
                               <TrashIcon />
                             </button>
                           </div>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
             <p className="text-center text-gray-500 py-8">Nessun report trovato.</p>
          )}
        </div>
      </>
    );
  }

  const userView = () => (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-2 px-8 pb-8">
      {isLoading ? (
         <p className="text-center text-gray-500 py-8">Caricamento report...</p>
      ) : savedReports.length > 0 ? (
        savedReports.map((report) => (
          <div key={report.key} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-800">{formatDateForDisplay(report.date)}</h3>
              <p className="text-sm text-gray-500 truncate max-w-sm">{report.text.split('\n')[2] || 'Nessun contenuto'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleDownloadReport(report)} className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors" aria-label="Scarica report">
                <DownloadIcon />
              </button>
              <button onClick={() => onEditReport(report)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" aria-label="Modifica report">
                <EditIcon />
              </button>
              <button onClick={() => setReportToDelete(report)} className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors" aria-label="Elimina report">
                <TrashIcon />
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 py-8">Nessun report salvato trovato.</p>
      )}
    </div>
  )

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 relative">
       {reportToDelete && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full text-center">
                <h2 className="text-xl font-bold text-gray-800">Conferma Eliminazione</h2>
                <p className="text-gray-600 mt-2">Sei sicuro di voler eliminare il report del <span className="font-semibold">{formatDateForDisplay(reportToDelete.date)}</span>? L'azione è irreversibile.</p>
                <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={cancelDelete}
                        className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={confirmDelete}
                        className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
                    >
                        Sì, Elimina
                    </button>
                </div>
            </div>
        </div>
      )}
      <div className="pt-8 space-y-6">
        <header className="px-8">
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => navigateTo('landing')}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 rounded-md p-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Torna al pannello di controllo"
            >
              <ArrowLeftIcon />
              <span className="hidden sm:inline">Indietro</span>
            </button>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Report Salvati</h1>
          </div>
          <p className="mt-2 text-center text-gray-500">
            {isMasterUser ? "Stai visualizzando i report di tutti gli utenti." : "Elenco dei tuoi report salvati nell'ultimo mese."}
          </p>
        </header>
        
        {isMasterUser ? masterView() : userView()}
      </div>
    </div>
  );
};

export default SavedReports;