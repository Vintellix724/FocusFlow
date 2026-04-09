import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useStore } from '../context/StoreContext';

export default function Planner() {
  const { tasks, toggleTask, addTask, deleteTask, editTask, subjects, focusHistory, user, setUser, showToast, journalEntries } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [showRoutineModal, setShowRoutineModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  
  // Auto-update current date if app is left open
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getDate() !== selectedDate.getDate() || now.getMonth() !== selectedDate.getMonth()) {
        // Only auto-update if they haven't manually selected a different date
        // Actually, let's just keep a reference to 'today' that updates
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [selectedDate]);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState(subjects.length > 0 ? subjects[0].name : 'General');
  const [newTaskDuration, setNewTaskDuration] = useState('60');
  const [newTaskTime, setNewTaskTime] = useState('09:00');
  const [newTaskPriority, setNewTaskPriority] = useState<'q1'|'q2'|'q3'|'q4'>('q1');
  const [viewMode, setViewMode] = useState<'list' | 'matrix'>('list');

  // Routine state
  const [routineSlots, setRoutineSlots] = useState(user?.studySlots || []);

  useEffect(() => {
    if (user?.studySlots) {
      setRoutineSlots(user.studySlots);
    }
  }, [user?.studySlots]);

  const handleAddSlot = () => {
    const newSlot = {
      id: Date.now().toString(),
      startTime: '09:00',
      endTime: '10:00',
      subjectId: subjects.length > 0 ? subjects[0].id : ''
    };
    setRoutineSlots([...routineSlots, newSlot]);
  };

  const handleUpdateSlot = (id: string, field: string, value: string) => {
    setRoutineSlots(routineSlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  const handleRemoveSlot = (id: string) => {
    setRoutineSlots(routineSlots.filter(slot => slot.id !== id));
  };

  const handleSaveRoutine = () => {
    if (user) {
      setUser({ ...user, studySlots: routineSlots });
      setShowRoutineModal(false);
      showToast('Daily routine saved!', 'success');
    }
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const jumpToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentMonth(today);
  };

  // Adjust timezone issues by formatting locally
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const selectedDateStr = formatDateLocal(selectedDate);
  const selectedTasks = tasks.filter(t => t.date === selectedDateStr);
  const selectedFocusTime = focusHistory[selectedDateStr] || 0;
  const selectedJournals = journalEntries ? journalEntries.filter(j => j.date.startsWith(selectedDateStr)) : [];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    if (editingTaskId) {
      editTask(editingTaskId, {
        title: newTaskTitle,
        subject: newTaskSubject,
        duration: parseInt(newTaskDuration),
        time: newTaskTime,
        color: 'primary',
        priority: newTaskPriority
      });
    } else {
      addTask({
        title: newTaskTitle,
        subject: newTaskSubject,
        duration: parseInt(newTaskDuration),
        time: newTaskTime,
        completed: false,
        date: selectedDateStr,
        type: 'study',
        color: 'primary',
        priority: newTaskPriority
      });
    }
    
    setNewTaskTitle('');
    setEditingTaskId(null);
    setShowAddTask(false);
    setNewTaskPriority('q1');
  };

  const openEditModal = (task: any) => {
    setEditingTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskSubject(task.subject);
    setNewTaskDuration(task.duration.toString());
    setNewTaskTime(task.time);
    setNewTaskPriority(task.priority || 'q1');
    setShowAddTask(true);
  };

  const closeAddTaskModal = () => {
    setShowAddTask(false);
    setEditingTaskId(null);
    setNewTaskTitle('');
    setNewTaskSubject(subjects.length > 0 ? subjects[0].name : 'General');
    setNewTaskDuration('60');
    setNewTaskTime('09:00');
    setNewTaskPriority('q1');
  };

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl pl-16 pr-6 py-4 border-b border-outline-variant/10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-syne font-bold text-2xl text-on-surface">Planner</h1>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowRoutineModal(true)}
              className="bg-secondary/10 text-secondary px-3 py-1.5 rounded-lg font-label text-xs uppercase tracking-widest hover:bg-secondary/20 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px] pointer-events-none">schedule</span>
              Routine
            </button>
            <button 
              onClick={jumpToToday}
              className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-label text-xs uppercase tracking-widest hover:bg-primary/20 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
        
        <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 shadow-lg">
          <div className="flex justify-between items-center mb-4 px-2">
            <button onClick={handlePrevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant pointer-events-none">chevron_left</span>
            </button>
            <span className="font-syne text-lg font-bold text-on-surface">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button onClick={handleNextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
              <span className="material-symbols-outlined text-on-surface-variant pointer-events-none">chevron_right</span>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(day => (
              <div key={day} className="text-center font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                {day.charAt(0)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
              const dateStr = formatDateLocal(date);
              const isSelected = date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
              const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
              const hasTasks = tasks.some(t => t.date === dateStr);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={clsx(
                    "relative flex flex-col items-center justify-center h-10 rounded-xl transition-all",
                    isSelected 
                      ? "bg-primary text-on-primary shadow-[0_4px_12px_rgba(172,199,255,0.3)] scale-105 z-10 font-bold" 
                      : "hover:bg-surface-container-highest text-on-surface-variant",
                    isToday && !isSelected ? "border border-tertiary text-tertiary font-bold bg-tertiary/5" : ""
                  )}
                >
                  <span className="font-mono text-sm pointer-events-none">{i + 1}</span>
                  {hasTasks && !isSelected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-tertiary pointer-events-none"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="p-6 space-y-6">
        <section className="bg-surface-container-high rounded-2xl p-4 border border-outline-variant/10 shadow-sm flex justify-between items-center">
          <div>
            <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Focus Time</h3>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-2xl text-primary">{(selectedFocusTime / 60).toFixed(1)}</span>
              <span className="font-mono text-xs text-on-surface-variant">hrs</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">timer</span>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-label text-sm uppercase tracking-widest text-on-surface-variant">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h2>
            <div className="flex items-center gap-2">
              {selectedTasks.length > 0 && (
                <div className="bg-surface-container-high rounded-lg p-1 flex border border-outline-variant/10">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={clsx(
                      "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                      viewMode === 'list' ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-on-surface"
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px] pointer-events-none">format_list_bulleted</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('matrix')}
                    className={clsx(
                      "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                      viewMode === 'matrix' ? "bg-primary/20 text-primary" : "text-on-surface-variant hover:text-on-surface"
                    )}
                  >
                    <span className="material-symbols-outlined text-[18px] pointer-events-none">grid_view</span>
                  </button>
                </div>
              )}
              <span className="font-mono text-[10px] bg-tertiary/10 text-tertiary px-2 py-1 rounded-md border border-tertiary/20">
                {selectedTasks.filter(t => !t.completed).length} Tasks Left
              </span>
            </div>
          </div>

          {selectedTasks.length === 0 ? (
            <div className="text-center py-10 bg-surface-container-low rounded-2xl border border-outline-variant/10 border-dashed">
              <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">event_available</span>
              <p className="font-body text-sm text-on-surface-variant">No tasks scheduled for this day.</p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-8">
              {/* Pending Tasks */}
              {selectedTasks.filter(t => !t.completed).length > 0 && (
                <div>
                  <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    Pending Tasks
                  </h3>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/20 before:to-transparent">
                    {selectedTasks.filter(t => !t.completed).map((task) => (
                      <div key={task.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <button 
                          onClick={() => toggleTask(task.id)}
                          className={clsx(
                            "flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface bg-surface-container-high shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors cursor-pointer",
                            task.completed ? "bg-tertiary text-on-tertiary border-tertiary/20" : "text-on-surface-variant hover:bg-surface-container-highest"
                          )}>
                          <span className="material-symbols-outlined text-[18px] pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {task.completed ? 'check' : task.type === 'study' ? 'menu_book' : task.type === 'practice' ? 'edit' : 'quiz'}
                          </span>
                        </button>
                        
                        <div className={clsx(
                          "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface-container-high p-4 rounded-2xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all relative group/card",
                          task.completed ? "opacity-60" : "shadow-md"
                        )}>
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openEditModal(task)}
                              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                            >
                              <span className="material-symbols-outlined text-[16px] pointer-events-none">edit</span>
                            </button>
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20"
                            >
                              <span className="material-symbols-outlined text-[16px] pointer-events-none">delete</span>
                            </button>
                          </div>
                          <div className="flex items-center justify-between mb-2 pr-16">
                            <div className="flex gap-2 items-center">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">{task.time}</span>
                              {task.priority && (
                                <span className={clsx(
                                  "font-mono text-[10px] px-2 py-0.5 rounded-md border uppercase",
                                  task.priority === 'q1' ? 'bg-error/10 text-error border-error/20' :
                                  task.priority === 'q2' ? 'bg-primary/10 text-primary border-primary/20' :
                                  task.priority === 'q3' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                                  'bg-surface-variant/10 text-surface-variant border-surface-variant/20'
                                )}>{task.priority}</span>
                              )}
                            </div>
                            <span className={clsx(
                              "font-mono text-[10px] px-2 py-0.5 rounded-md border",
                              task.color === 'primary' ? 'bg-primary/10 text-primary border-primary/20' :
                              task.color === 'secondary' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                              task.color === 'tertiary' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                              'bg-error/10 text-error border-error/20'
                            )}>{task.duration}m</span>
                          </div>
                          <h3 className={clsx(
                            "font-syne font-bold text-sm",
                            task.completed ? "line-through text-on-surface-variant" : "text-on-surface"
                          )}>{task.title}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Tasks */}
              {selectedTasks.filter(t => t.completed).length > 0 && (
                <div>
                  <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                    Completed ({selectedTasks.filter(t => t.completed).length})
                  </h3>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/20 before:to-transparent">
                    {selectedTasks.filter(t => t.completed).map((task) => (
                      <div key={task.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <button 
                          onClick={() => toggleTask(task.id)}
                          className={clsx(
                            "flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface bg-surface-container-high shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-colors cursor-pointer",
                            task.completed ? "bg-tertiary text-on-tertiary border-tertiary/20" : "text-on-surface-variant hover:bg-surface-container-highest"
                          )}>
                          <span className="material-symbols-outlined text-[18px] pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {task.completed ? 'check' : task.type === 'study' ? 'menu_book' : task.type === 'practice' ? 'edit' : 'quiz'}
                          </span>
                        </button>
                        
                        <div className={clsx(
                          "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface-container-high p-4 rounded-2xl border border-outline-variant/10 hover:border-outline-variant/30 transition-all relative group/card",
                          task.completed ? "opacity-60" : "shadow-md"
                        )}>
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button 
                              onClick={() => openEditModal(task)}
                              className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                            >
                              <span className="material-symbols-outlined text-[16px] pointer-events-none">edit</span>
                            </button>
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20"
                            >
                              <span className="material-symbols-outlined text-[16px] pointer-events-none">delete</span>
                            </button>
                          </div>
                          <div className="flex items-center justify-between mb-2 pr-16">
                            <div className="flex gap-2 items-center">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">{task.time}</span>
                              {task.priority && (
                                <span className={clsx(
                                  "font-mono text-[10px] px-2 py-0.5 rounded-md border uppercase",
                                  task.priority === 'q1' ? 'bg-error/10 text-error border-error/20' :
                                  task.priority === 'q2' ? 'bg-primary/10 text-primary border-primary/20' :
                                  task.priority === 'q3' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                                  'bg-surface-variant/10 text-surface-variant border-surface-variant/20'
                                )}>{task.priority}</span>
                              )}
                            </div>
                            <span className={clsx(
                              "font-mono text-[10px] px-2 py-0.5 rounded-md border",
                              task.color === 'primary' ? 'bg-primary/10 text-primary border-primary/20' :
                              task.color === 'secondary' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                              task.color === 'tertiary' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                              'bg-error/10 text-error border-error/20'
                            )}>{task.duration}m</span>
                          </div>
                          <h3 className={clsx(
                            "font-syne font-bold text-sm",
                            task.completed ? "line-through text-on-surface-variant" : "text-on-surface"
                          )}>{task.title}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'q1', title: 'Do First', desc: 'Urgent & Important', color: 'error', tasks: selectedTasks.filter(t => t.priority === 'q1' || !t.priority) },
                { id: 'q2', title: 'Schedule', desc: 'Important, Not Urgent', color: 'primary', tasks: selectedTasks.filter(t => t.priority === 'q2') },
                { id: 'q3', title: 'Delegate', desc: 'Urgent, Not Important', color: 'tertiary', tasks: selectedTasks.filter(t => t.priority === 'q3') },
                { id: 'q4', title: 'Eliminate', desc: 'Not Urgent, Not Important', color: 'surface-variant', tasks: selectedTasks.filter(t => t.priority === 'q4') },
              ].map(quadrant => (
                <div key={quadrant.id} className="bg-surface-container-high p-4 rounded-2xl border border-outline-variant/10 flex flex-col h-48">
                  <div className="mb-3">
                    <h3 className={clsx("font-syne font-bold text-sm", `text-${quadrant.color}`)}>{quadrant.title}</h3>
                    <p className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">{quadrant.desc}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {quadrant.tasks.length === 0 ? (
                      <p className="text-xs text-on-surface-variant/50 italic">No tasks</p>
                    ) : (
                      quadrant.tasks.map(task => (
                        <div key={task.id} className={clsx(
                          "p-2 rounded-lg border text-xs flex items-center justify-between group",
                          task.completed ? "bg-surface-container border-outline-variant/10 opacity-50" : "bg-surface border-outline-variant/20 shadow-sm"
                        )}>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <button onClick={() => toggleTask(task.id)} className="shrink-0">
                              <span className="material-symbols-outlined text-[14px] pointer-events-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {task.completed ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                            </button>
                            <span className={clsx("truncate", task.completed && "line-through")}>{task.title}</span>
                          </div>
                          <button onClick={() => openEditModal(task)} className="opacity-0 group-hover:opacity-100 shrink-0 text-on-surface-variant hover:text-primary transition-opacity">
                            <span className="material-symbols-outlined text-[14px] pointer-events-none">edit</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Journal Entries Section */}
          {selectedJournals.length > 0 && (
            <div className="mt-8">
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                Journal Entries
              </h3>
              <div className="space-y-4">
                {selectedJournals.map((journal) => (
                  <div key={journal.id} className="bg-surface-container-high p-4 rounded-2xl border border-outline-variant/10 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{journal.mood}</span>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {new Date(journal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface whitespace-pre-wrap">{journal.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {showRoutineModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowRoutineModal(false)}
        >
          <div 
            className="bg-surface-container-high w-full max-w-md rounded-3xl p-6 border border-outline-variant/20 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-syne font-bold text-xl text-on-surface">Daily Routine</h2>
              <button onClick={() => setShowRoutineModal(false)} className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {routineSlots.length === 0 ? (
                <p className="text-sm text-on-surface-variant text-center py-4">No study slots added yet. Add slots to build your daily routine.</p>
              ) : (
                routineSlots.map((slot, index) => (
                  <div key={slot.id} className="bg-surface-container p-3 rounded-xl border border-outline-variant/10 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="font-label text-xs uppercase tracking-widest text-primary">Slot {index + 1}</span>
                      <button onClick={() => handleRemoveSlot(slot.id)} className="text-error hover:bg-error/10 p-1 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Start Time</label>
                        <input 
                          type="time" 
                          value={slot.startTime}
                          onChange={(e) => handleUpdateSlot(slot.id, 'startTime', e.target.value)}
                          className="w-full bg-surface-container-highest text-on-surface px-3 py-2 rounded-lg font-mono text-sm border border-outline-variant/20 focus:border-primary/50 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">End Time</label>
                        <input 
                          type="time" 
                          value={slot.endTime}
                          onChange={(e) => handleUpdateSlot(slot.id, 'endTime', e.target.value)}
                          className="w-full bg-surface-container-highest text-on-surface px-3 py-2 rounded-lg font-mono text-sm border border-outline-variant/20 focus:border-primary/50 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Subject</label>
                      <select 
                        value={slot.subjectId}
                        onChange={(e) => handleUpdateSlot(slot.id, 'subjectId', e.target.value)}
                        className="w-full bg-surface-container-highest text-on-surface px-3 py-2 rounded-lg font-body text-sm border border-outline-variant/20 focus:border-primary/50 outline-none appearance-none"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
              
              <button 
                onClick={handleAddSlot}
                className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant/30 text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 font-label text-xs uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Study Slot
              </button>
            </div>

            <button 
              onClick={handleSaveRoutine}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-label uppercase tracking-widest text-sm hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(172,199,255,0.2)]"
            >
              Save Routine
            </button>
          </div>
        </div>
      )}

      {showAddTask && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeAddTaskModal}
        >
          <div 
            className="bg-surface-container-high w-full max-w-md rounded-3xl p-6 border border-outline-variant/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-syne font-bold text-xl text-on-surface">{editingTaskId ? 'Edit Task' : 'Add New Task'}</h2>
              <button onClick={closeAddTaskModal} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Task Title</label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Read Chapter 4"
                  className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Subject</label>
                  <select 
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    {subjects.length > 0 ? (
                      subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)
                    ) : (
                      <option value="General">General</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Duration (mins)</label>
                  <input 
                    type="number" 
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Time</label>
                  <input 
                    type="time" 
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Priority</label>
                  <select 
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="q1">Do First (Urgent & Important)</option>
                    <option value="q2">Schedule (Important)</option>
                    <option value="q3">Delegate (Urgent)</option>
                    <option value="q4">Eliminate (Neither)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl mt-4 hover:bg-primary/90 transition-colors">
                {editingTaskId ? 'Save Changes' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      <button 
        onClick={() => {
          setEditingTaskId(null);
          setNewTaskTitle('');
          setNewTaskSubject(subjects.length > 0 ? subjects[0].name : 'General');
          setNewTaskDuration('60');
          setNewTaskTime('09:00');
          setNewTaskPriority('q1');
          setShowAddTask(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0_4px_20px_rgba(172,199,255,0.4)] flex items-center justify-center active:scale-90 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
      </button>
    </div>
  );
}
