import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Trophy, Medal } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LeaderboardScreen() {
  const { students, user, stats } = useAppStore();
  
  // Include current user in leaderboard if not admin
  const allUsers = [...students];
  if (user && user.role === 'user') {
    if (!allUsers.find(s => s.email === user.email)) {
      allUsers.push({
        id: 'current',
        name: user.name,
        email: user.email,
        xp: stats.xp,
        level: stats.level,
        rank: stats.rank,
        completedCourses: stats.lessonsCompleted
      });
    } else {
      // Update existing current user stats
      const idx = allUsers.findIndex(s => s.email === user.email);
      allUsers[idx] = {
        ...allUsers[idx],
        xp: stats.xp,
        level: stats.level,
        rank: stats.rank,
        completedCourses: stats.lessonsCompleted
      };
    }
  }

  const sortedUsers = allUsers.sort((a, b) => b.xp - a.xp);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-3xl mx-auto">
      <header className="text-center space-y-2">
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Trophy size={32} className="text-yellow-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Clasificación</h1>
        <p className="text-slate-400 font-medium">Compite con tus compañeros y alcanza el primer lugar.</p>
      </header>

      <div className="bg-[#252538] rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
        {sortedUsers.map((student, index) => (
          <div 
            key={student.id}
            className={cn(
              "flex items-center gap-4 p-4 md:p-6 border-b border-slate-800 last:border-0 transition-colors",
              student.email === user?.email ? "bg-purple-500/10" : "hover:bg-[#2a2a40]"
            )}
          >
            <div className="w-8 text-center font-black text-slate-500 text-lg">
              {index === 0 ? <Medal className="text-yellow-500 mx-auto" size={28} /> : 
               index === 1 ? <Medal className="text-slate-300 mx-auto" size={28} /> : 
               index === 2 ? <Medal className="text-amber-600 mx-auto" size={28} /> : 
               index + 1}
            </div>
            
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-4 border-[#1e1e2f] shadow-md flex items-center justify-center overflow-hidden shrink-0">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} alt={student.name} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1">
              <h3 className={cn("font-bold text-lg", student.email === user?.email ? "text-purple-400" : "text-white")}>
                {student.name} {student.email === user?.email && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full ml-2 uppercase tracking-wider">Tú</span>}
              </h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-0.5">Nivel {student.level} • {student.rank}</p>
            </div>
            
            <div className="text-right">
              <div className="font-black text-purple-400 text-xl">{student.xp}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">XP</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
