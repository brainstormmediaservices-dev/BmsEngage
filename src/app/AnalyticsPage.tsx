import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { MOCK_ANALYTICS_DATA, MOCK_PLATFORM_DATA, SUPPORTED_PLATFORMS } from '../lib/mock-data';
import { ChartCard } from '../components/cards/ChartCard';
import { StatCard } from '../components/cards/StatCard';
import { Button } from '../components/ui/Button';
import { Download, Calendar, Filter, ChevronDown, FileText, Table, FileJson } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

const COLORS = ['#410179', '#6D28D9', '#7C3AED', '#8B5CF6'];

export default function AnalyticsPage() {
  const [selectedPlatform, setSelectedPlatform] = useState('All Platforms');
  const [selectedRange, setSelectedRange] = useState('Last 30 Days');
  const [showExportOptions, setShowExportOptions] = useState(false);

  const exportFormats = [
    { label: 'Export as CSV', icon: Table, format: 'CSV' },
    { label: 'Export as Excel', icon: FileText, format: 'XLSX' },
    { label: 'Export as PDF', icon: FileJson, format: 'PDF' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-text mb-2">Analytics</h1>
          <p className="text-text-muted font-medium">Track your agency's growth and engagement metrics across all platforms.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Platform Filter */}
          <div className="relative group">
            <select 
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="appearance-none h-11 pl-4 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-text outline-none focus:border-primary/50 cursor-pointer transition-all"
            >
              <option>All Platforms</option>
              {SUPPORTED_PLATFORMS.map(p => <option key={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>

          {/* Date Range Filter */}
          <div className="relative group">
            <select 
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
              className="appearance-none h-11 pl-4 pr-10 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-text outline-none focus:border-primary/50 cursor-pointer transition-all"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>Custom Range</option>
            </select>
            <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>

          {/* Export Button */}
          <div className="relative">
            <Button 
              variant="outline" 
              className="h-11 rounded-xl bg-white/5 border-white/10 font-bold"
              onClick={() => setShowExportOptions(!showExportOptions)}
            >
              <Download size={18} className="mr-2" /> Export
            </Button>
            
            <AnimatePresence>
              {showExportOptions && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 glass border border-white/10 rounded-xl p-2 z-50 shadow-2xl"
                >
                  {exportFormats.map((opt) => (
                    <button
                      key={opt.format}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-text-muted hover:text-text hover:bg-white/5 transition-all"
                      onClick={() => setShowExportOptions(false)}
                    >
                      <opt.icon size={14} />
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Reach" value="2.4M" change="+18.2%" trend="up" />
        <StatCard label="Engagement" value="482K" change="+12.5%" trend="up" />
        <StatCard label="Followers" value="+12.4K" change="+4.2%" trend="up" />
        <StatCard label="Avg. CTR" value="3.2%" change="-0.8%" trend="down" />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Engagement Over Time" subtitle="Daily engagement and reach metrics">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_ANALYTICS_DATA}>
              <defs>
                <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#410179" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#410179" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="engagement" stroke="#410179" fillOpacity={1} fill="url(#colorEngagement)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Platform Comparison" subtitle="Engagement distribution across social networks">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MOCK_ANALYTICS_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
              />
              <Bar dataKey="reach" fill="#410179" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Content Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ChartCard title="Content Type Performance" className="lg:col-span-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={MOCK_PLATFORM_DATA}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
              >
                {MOCK_PLATFORM_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15,15,20,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="lg:col-span-2 glass border border-white/10 p-8 rounded-[32px] space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-2xl text-text">Top Performing Content</h3>
            <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest">View All</Button>
          </div>
          <div className="space-y-4">
            {[
              { title: 'Summer Campaign Video', reach: '1.2M', engagement: '124K', growth: '+24%', platform: 'Instagram' },
              { title: 'Product Launch Graphic', reach: '842K', engagement: '82K', growth: '+18%', platform: 'Twitter' },
              { title: 'Client Testimonial Photo', reach: '420K', engagement: '45K', growth: '+12%', platform: 'LinkedIn' },
            ].map((media, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Filter size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-text group-hover:text-primary transition-colors">{media.title}</p>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{media.platform} • {media.reach} Reach</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-500">{media.growth}</p>
                  <p className="text-[8px] text-text-muted uppercase tracking-widest font-black">Growth</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
