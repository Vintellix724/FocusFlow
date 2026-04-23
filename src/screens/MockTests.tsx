import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { MockTest, getMockTests, saveMockTest, deleteMockTest } from '../lib/db';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function MockTests() {
  const { theme, toggleTheme, showToast } = useStore();
  const [tests, setTests] = useState<MockTest[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<MockTest | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'analytics'>('tests');
  const [previewFile, setPreviewFile] = useState<{ blob: Blob, name: string, type: string } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [coachingName, setCoachingName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeAllocated, setTimeAllocated] = useState(180); // minutes
  const [totalMarks, setTotalMarks] = useState(300);
  
  const [questionPaperFile, setQuestionPaperFile] = useState<File | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [syllabusFile, setSyllabusFile] = useState<File | null>(null);

  // Result Form states
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [marksObtained, setMarksObtained] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);

  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const loadedTests = await getMockTests();
      setTests(loadedTests);
    } catch (error) {
      console.error("Failed to load tests", error);
      showToast("Failed to load mock tests", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) {
      showToast("Title and Date are required", "error");
      return;
    }

    try {
      const newTest: MockTest = {
        id: uuidv4(),
        title,
        coachingName: coachingName.trim() || undefined,
        date,
        timeAllocated,
        totalMarks,
        isAttempted: false,
        questionPaperName: questionPaperFile?.name,
        answerKeyName: answerKeyFile?.name,
        syllabusName: syllabusFile?.name,
        questionPaperFile: questionPaperFile ? new Blob([await questionPaperFile.arrayBuffer()], { type: questionPaperFile.type }) : null,
        answerKeyFile: answerKeyFile ? new Blob([await answerKeyFile.arrayBuffer()], { type: answerKeyFile.type }) : null,
        syllabusFile: syllabusFile ? new Blob([await syllabusFile.arrayBuffer()], { type: syllabusFile.type }) : null,
      };

      await saveMockTest(newTest);
      showToast("Mock test added successfully", "success");
      setShowAddModal(false);
      resetForm();
      loadTests();
    } catch (error) {
      console.error("Error saving test:", error);
      showToast("Failed to save mock test", "error");
    }
  };

  const resetForm = () => {
    setTitle('');
    setCoachingName('');
    setDate(new Date().toISOString().split('T')[0]);
    setTimeAllocated(180);
    setTotalMarks(300);
    setQuestionPaperFile(null);
    setAnswerKeyFile(null);
    setSyllabusFile(null);
  };

  const confirmDelete = async () => {
    if (!testToDelete) return;
    try {
      await deleteMockTest(testToDelete);
      showToast("Test deleted", "info");
      loadTests();
    } catch (error) {
      showToast("Failed to delete test", "error");
    } finally {
      setTestToDelete(null);
    }
  };

  const openResultModal = (test: MockTest) => {
    setSelectedTest(test);
    setCorrectAnswers(test.correctAnswers || 0);
    setIncorrectAnswers(test.incorrectAnswers || 0);
    setMarksObtained(test.marksObtained || 0);
    setTimeTaken(test.timeTaken || test.timeAllocated || 0);
    setShowResultModal(true);
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest) return;

    try {
      const updatedTest = {
        ...selectedTest,
        isAttempted: true,
        correctAnswers,
        incorrectAnswers,
        marksObtained,
        timeTaken
      };
      await saveMockTest(updatedTest);
      showToast("Results saved successfully", "success");
      setShowResultModal(false);
      loadTests();
    } catch (error) {
      showToast("Failed to save results", "error");
    }
  };

  const openPreview = (blob: Blob | null | undefined, filename: string | undefined) => {
    if (!blob || !filename) {
      showToast("File not available", "error");
      return;
    }
    setPreviewFile({ blob, name: filename, type: blob.type });
  };

  const downloadFile = (blob: Blob | null | undefined, filename: string | undefined) => {
    if (!blob || !filename) {
      showToast("File not available", "error");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareAnalytics = async () => {
    const attemptedTests = tests.filter(t => t.isAttempted);
    if (attemptedTests.length === 0) {
      showToast("No attempted tests available to share.", "error");
      return;
    }

    let shareText = "📊 My Mock Test Performance Analytics:\n\n";
    attemptedTests.forEach((test, index) => {
      shareText += `${index + 1}. ${test.title} (${new Date(test.date).toLocaleDateString()})\n`;
      if (test.coachingName) {
        shareText += `   Coaching: ${test.coachingName}\n`;
      }
      shareText += `   Score: ${test.marksObtained}/${test.totalMarks}\n`;
      shareText += `   Time Taken: ${test.timeTaken}/${test.timeAllocated} mins\n`;
      shareText += `   Accuracy: ${test.correctAnswers} Correct, ${test.incorrectAnswers} Incorrect\n\n`;
    });
    shareText += "Can you analyze this data and give me some tips to improve?";

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Mock Test Analytics',
          text: shareText,
        });
        showToast("Shared successfully!", "success");
      } else {
        await navigator.clipboard.writeText(shareText);
        showToast("Analytics data copied to clipboard! You can paste it to any AI.", "success");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      try {
         await navigator.clipboard.writeText(shareText);
         showToast("Analytics data copied to clipboard!", "success");
      } catch (clipboardError) {
         showToast("Failed to share or copy data.", "error");
      }
    }
  };

  const attemptedTests = tests.filter(t => t.isAttempted).reverse(); // Reverse to show chronological order if sorted by date desc

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="bg-surface-container-highest pt-12 pb-6 px-6 rounded-b-[2rem] shadow-sm relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-syne font-bold text-3xl text-on-surface">Mock Test Add</h1>
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-on-surface shadow-sm"
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
        <p className="font-body text-on-surface-variant">Manage your local test papers and track performance.</p>
        
        <div className="flex bg-surface-variant rounded-xl p-1 shadow-inner mt-6">
          <button 
            onClick={() => setActiveTab('tests')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'tests' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-lg">quiz</span>
            Tests
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'analytics' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-lg">insights</span>
            Analytics
          </button>
        </div>
      </header>

      <main className="px-6 mt-6 max-w-2xl mx-auto space-y-6">
        {activeTab === 'tests' ? (
          <>
            <button 
              onClick={() => setShowAddModal(true)}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-2xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Add New Mock Test
            </button>

            <div className="space-y-4">
              {tests.length === 0 ? (
                <div className="text-center py-12 bg-surface-container rounded-3xl border border-outline-variant/20 border-dashed">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">quiz</span>
                  <p className="font-body text-on-surface-variant">No mock tests added yet.</p>
                </div>
              ) : (
                tests.map((test) => (
                  <motion.div 
                    key={test.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-surface-container p-5 rounded-3xl shadow-sm border border-outline-variant/20 relative overflow-hidden"
                  >
                {test.isAttempted && (
                  <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Attempted
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-syne font-bold text-xl text-on-surface">{test.title}</h3>
                    {test.coachingName && (
                      <span className="inline-block bg-tertiary/10 text-tertiary text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 mb-1 uppercase tracking-wider">
                        {test.coachingName}
                      </span>
                    )}
                    <p className="font-body text-sm text-on-surface-variant flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(test.date).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => setTestToDelete(test.id)}
                    className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {test.questionPaperName && (
                    <button onClick={() => openPreview(test.questionPaperFile, test.questionPaperName)} className="bg-surface-variant text-on-surface-variant text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-surface-variant/80">
                      <span className="material-symbols-outlined text-[14px]">description</span> Paper
                    </button>
                  )}
                  {test.answerKeyName && (
                    <button onClick={() => openPreview(test.answerKeyFile, test.answerKeyName)} className="bg-surface-variant text-on-surface-variant text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-surface-variant/80">
                      <span className="material-symbols-outlined text-[14px]">key</span> Key
                    </button>
                  )}
                  {test.syllabusName && (
                    <button onClick={() => openPreview(test.syllabusFile, test.syllabusName)} className="bg-surface-variant text-on-surface-variant text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-surface-variant/80">
                      <span className="material-symbols-outlined text-[14px]">menu_book</span> Syllabus
                    </button>
                  )}
                </div>

                {test.isAttempted ? (
                  <div className="bg-surface rounded-xl p-4 border border-outline-variant/10">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-label">Score</p>
                        <p className="font-mono font-bold text-lg text-primary">{test.marksObtained} <span className="text-sm text-on-surface-variant">/ {test.totalMarks}</span></p>
                      </div>
                      <div>
                        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-label">Time Taken</p>
                        <p className="font-mono font-bold text-lg text-on-surface">{test.timeTaken} <span className="text-sm text-on-surface-variant">/ {test.timeAllocated}m</span></p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm font-body">
                      <span className="text-green-500 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">check_circle</span> {test.correctAnswers} Correct</span>
                      <span className="text-error flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">cancel</span> {test.incorrectAnswers} Incorrect</span>
                    </div>
                    <button 
                      onClick={() => openResultModal(test)}
                      className="mt-4 w-full bg-surface-variant text-on-surface-variant py-2 rounded-lg text-sm font-medium hover:bg-outline/10 transition-colors"
                    >
                      Edit Results
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => openResultModal(test)}
                    className="w-full bg-primary/10 text-primary font-bold py-3 rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">edit_note</span>
                    Add Results
                  </button>
                )}
              </motion.div>
            ))
          )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {attemptedTests.length < 2 ? (
              <div className="text-center py-12 bg-surface-container rounded-3xl border border-outline-variant/20 border-dashed">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">insights</span>
                <p className="font-body text-on-surface-variant">Attempt at least 2 mock tests to see analytics and compare performance.</p>
              </div>
            ) : (
              <>
                <button 
                  onClick={handleShareAnalytics}
                  className="w-full bg-surface-variant text-on-surface-variant font-bold py-4 rounded-2xl hover:bg-outline/10 transition-colors flex items-center justify-center gap-2 shadow-sm border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined">share</span>
                  Share Analytics Data
                </button>

                <div className="bg-surface-container p-5 rounded-3xl shadow-sm border border-outline-variant/20">
                  <h3 className="font-syne font-bold text-lg text-on-surface mb-4">Score Trend</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={attemptedTests}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="title" 
                          stroke="rgba(255,255,255,0.5)" 
                          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                          tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                        />
                        <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E1E1E', border: 'none', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="marksObtained" name="Marks" stroke="#4F8EF7" strokeWidth={3} dot={{ r: 4, fill: '#4F8EF7' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-surface-container p-5 rounded-3xl shadow-sm border border-outline-variant/20">
                  <h3 className="font-syne font-bold text-lg text-on-surface mb-4">Accuracy (Correct vs Incorrect)</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attemptedTests}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis 
                          dataKey="title" 
                          stroke="rgba(255,255,255,0.5)" 
                          tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                          tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                        />
                        <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1E1E1E', border: 'none', borderRadius: '12px', color: '#fff' }}
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Legend />
                        <Bar dataKey="correctAnswers" name="Correct" fill="#4CAF50" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="incorrectAnswers" name="Incorrect" fill="#F44336" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Coaching Comparison */}
                {attemptedTests.some(t => t.coachingName) && (
                  <div className="bg-surface-container p-5 rounded-3xl shadow-sm border border-outline-variant/20">
                    <h3 className="font-syne font-bold text-lg text-on-surface mb-4">Coaching Comparison (Avg Marks)</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={Object.values(
                            attemptedTests.reduce((acc, test) => {
                              const name = test.coachingName || 'Other';
                              if (!acc[name]) acc[name] = { name, totalMarks: 0, count: 0 };
                              acc[name].totalMarks += (test.marksObtained || 0);
                              acc[name].count += 1;
                              return acc;
                            }, {} as Record<string, { name: string, totalMarks: number, count: number }>)
                          ).map(c => ({ name: c.name, avgMarks: Math.round(c.totalMarks / c.count) }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis 
                            dataKey="name" 
                            stroke="rgba(255,255,255,0.5)" 
                            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                          />
                          <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1E1E1E', border: 'none', borderRadius: '12px', color: '#fff' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          />
                          <Bar dataKey="avgMarks" name="Average Marks" fill="#9C27B0" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Add Test Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-xl relative z-10 max-h-[85dvh] overflow-y-auto custom-scrollbar flex flex-col"
            >
              <h2 className="font-syne font-bold text-2xl text-on-surface mb-6 shrink-0">Add Mock Test</h2>
              <form onSubmit={handleAddTest} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2">
                <div>
                  <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Test Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g., Full Syllabus Mock 1"
                    required
                  />
                </div>
                <div>
                  <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Coaching Name (Optional)</label>
                  <input 
                    type="text" 
                    value={coachingName}
                    onChange={(e) => setCoachingName(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                    placeholder="e.g., Allen, Aakash, PW"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Date</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Time (Mins)</label>
                    <input 
                      type="number" 
                      value={timeAllocated}
                      onChange={(e) => setTimeAllocated(Number(e.target.value))}
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Total Marks</label>
                  <input 
                    type="number" 
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant">Files (Stored Locally)</p>
                  
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Question Paper (PDF)</label>
                    <input 
                      type="file" 
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileChange(e, setQuestionPaperFile)}
                      className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Answer Key (PDF/Image)</label>
                    <input 
                      type="file" 
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileChange(e, setAnswerKeyFile)}
                      className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Syllabus (Optional)</label>
                    <input 
                      type="file" 
                      accept=".pdf,image/*"
                      onChange={(e) => handleFileChange(e, setSyllabusFile)}
                      className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 sticky bottom-0 bg-surface pb-2 mt-auto shrink-0 border-t border-outline-variant/10">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-highest transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl font-bold text-on-primary bg-primary hover:bg-primary/90 transition-colors"
                  >
                    Save Test
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Result Modal */}
      <AnimatePresence>
        {showResultModal && selectedTest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResultModal(false)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface w-full max-w-md rounded-3xl p-6 shadow-xl relative z-10 max-h-[85dvh] overflow-y-auto custom-scrollbar flex flex-col"
            >
              <h2 className="font-syne font-bold text-2xl text-on-surface mb-2 shrink-0">Add Results</h2>
              <p className="text-sm text-on-surface-variant mb-6 shrink-0">{selectedTest.title}</p>
              
              <form onSubmit={handleSaveResult} className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-24 sm:pb-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Correct Ans</label>
                    <input 
                      type="number" 
                      value={correctAnswers}
                      onChange={(e) => setCorrectAnswers(Number(e.target.value))}
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Incorrect Ans</label>
                    <input 
                      type="number" 
                      value={incorrectAnswers}
                      onChange={(e) => setIncorrectAnswers(Number(e.target.value))}
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Marks Obtained</label>
                    <input 
                      type="number" 
                      value={marksObtained}
                      onChange={(e) => setMarksObtained(Number(e.target.value))}
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-label text-xs uppercase tracking-wider text-on-surface-variant mb-1">Time Taken (Mins)</label>
                    <input 
                      type="number" 
                      value={timeTaken}
                      onChange={(e) => setTimeTaken(Number(e.target.value))}
                      className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-4 py-3 font-body text-on-surface focus:outline-none focus:border-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 sticky bottom-0 bg-surface pb-2 mt-auto shrink-0 border-t border-outline-variant/10">
                  <button 
                    type="button"
                    onClick={() => setShowResultModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-highest transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 rounded-xl font-bold text-on-primary bg-primary hover:bg-primary/90 transition-colors"
                  >
                    Save Results
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {testToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTestToDelete(null)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface w-full max-w-sm rounded-3xl p-6 shadow-xl relative z-10 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h2 className="font-syne font-bold text-2xl text-on-surface mb-2">Delete Test?</h2>
              <p className="text-on-surface-variant mb-6">
                Are you sure you want to delete this mock test? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setTestToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-on-surface-variant bg-surface-container hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-error hover:bg-error/90 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPreviewFile(null)}></div>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface w-full max-w-4xl rounded-3xl p-4 sm:p-6 shadow-xl relative z-10 flex flex-col h-[90dvh]"
            >
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h2 className="font-syne font-bold text-xl text-on-surface truncate pr-4">{previewFile.name}</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => downloadFile(previewFile.blob, previewFile.name)}
                    className="bg-primary text-on-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                    <span className="hidden sm:inline">Download</span>
                  </button>
                  <button 
                    onClick={() => setPreviewFile(null)}
                    className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/20 relative">
                {previewFile.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(previewFile.blob)} 
                    alt={previewFile.name}
                    className="w-full h-full object-contain"
                  />
                ) : previewFile.type === 'application/pdf' ? (
                  <iframe 
                    src={URL.createObjectURL(previewFile.blob)} 
                    className="w-full h-full border-0"
                    title={previewFile.name}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-on-surface-variant p-6 text-center">
                    <span className="material-symbols-outlined text-6xl mb-4 opacity-50">description</span>
                    <p className="mb-4">Preview not available for this file type.</p>
                    <button 
                      onClick={() => downloadFile(previewFile.blob, previewFile.name)}
                      className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined">download</span>
                      Download File
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
