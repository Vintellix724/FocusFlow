import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Home",
      icon: "home",
      description: "Your central dashboard. Here you can see your daily progress, upcoming tasks, and quick stats like your current streak and days left until your exam. It gives you a bird's-eye view of your study journey."
    },
    {
      title: "Timer (Pomodoro & Stopwatch)",
      icon: "timer",
      description: "The core of your focus sessions. Use the Pomodoro mode for structured study intervals (e.g., 25 mins focus, 5 mins break) or the Stopwatch mode for open-ended studying. Growing virtual trees keeps you motivated while you focus."
    },
    {
      title: "Subjects & Topics",
      icon: "menu_book",
      description: "Organize your syllabus. Create subjects, assign colors, and break them down into smaller, manageable topics. Track your progress for each topic (Pending, In Progress, Completed) to ensure you cover everything."
    },
    {
      title: "Planner & Routine",
      icon: "event_note",
      description: "Schedule your day effectively. Add specific tasks to your calendar, set priorities (Q1-Q4), and establish a daily study routine. This helps you build consistency and avoid last-minute cramming."
    },
    {
      title: "Live Study Room",
      icon: "groups",
      description: "Study alongside others in real-time. Seeing peers focusing can boost your own motivation and accountability. Start a timer session to automatically appear in the live room."
    },
    {
      title: "Leaderboard",
      icon: "leaderboard",
      description: "A friendly competitive space. Earn XP (Experience Points) by completing focus sessions and tasks. Climb the ranks by staying consistent and out-studying your peers."
    },
    {
      title: "Profile & Analytics",
      icon: "person",
      description: "Deep dive into your study habits. View your focus distribution over the week, month, or year. See which subjects you spend the most time on, and adjust your daily goals and minimum streak requirements."
    }
  ];

  return (
    <div className="bg-surface text-on-surface font-body min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl pl-6 pr-6 py-4 border-b border-outline-variant/10 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <h1 className="font-syne font-bold text-2xl text-on-surface">About App</h1>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-8">
        <section className="text-center space-y-4 mb-10">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-4xl">school</span>
          </div>
          <h2 className="font-syne font-bold text-3xl text-on-surface">Welcome to Your Study Hub</h2>
          <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
            This application is designed to help you organize your studies, maintain focus, and track your progress systematically. Here is a detailed guide on how to use every feature.
          </p>
        </section>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/10 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-14 h-14 shrink-0 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">{section.icon}</span>
              </div>
              <div>
                <h3 className="font-syne font-bold text-xl text-on-surface mb-2">{section.title}</h3>
                <p className="text-on-surface-variant leading-relaxed">
                  {section.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-12 bg-tertiary/10 rounded-2xl p-8 border border-tertiary/20 text-center">
          <h3 className="font-syne font-bold text-xl text-tertiary mb-3">Pro Tip for Success</h3>
          <p className="text-on-surface-variant">
            Consistency is key. Start by setting up your <strong>Subjects</strong>, then plan your week in the <strong>Planner</strong>. Use the <strong>Timer</strong> daily to execute your plan, and review your <strong>Analytics</strong> at the end of the week to adjust your strategy.
          </p>
        </section>
      </main>
    </div>
  );
}
