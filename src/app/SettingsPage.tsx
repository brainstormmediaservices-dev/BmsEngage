import * as React from 'react';
import { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  CreditCard, 
  LogOut, 
  Eye, 
  EyeOff, 
  Camera, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  History,
  Download,
  TrendingUp,
  MessageSquare,
  Zap,
  Users,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast('Settings updated successfully!', 'success');
    }, 1000);
  };

  const tabs = [
    { icon: User, label: 'Profile' },
    { icon: Bell, label: 'Notifications' },
    { icon: Shield, label: 'Security' },
    { icon: Globe, label: 'Agency Profile' },
    { icon: CreditCard, label: 'Billing' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-text mb-2">Settings</h1>
          <p className="text-text-muted font-medium">Manage your personal preferences, agency profile, and billing information.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-bold bg-white/5 border-white/10">Cancel</Button>
          <Button onClick={handleSave} isLoading={isSaving} className="rounded-xl h-11 px-8 font-black shadow-xl shadow-primary/30">Save All Changes</Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-72 space-y-2">
          <div className="glass border border-white/10 p-2 rounded-[24px]">
            {tabs.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === item.label 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-text-muted hover:text-text hover:bg-white/5"
                )}
              >
                <item.icon size={18} className={cn(activeTab === item.label ? "text-white" : "text-text-muted")} />
                {item.label}
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-white/10">
              <button className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all">
                <LogOut size={18} />
                Log Out
              </button>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="bg-primary/5 border border-primary/10 p-6 rounded-[24px] mt-6">
            <h4 className="text-sm font-black text-text mb-2">Need help?</h4>
            <p className="text-xs text-text-muted leading-relaxed mb-4">Check our documentation or contact support for assistance with your account.</p>
            <Button variant="outline" size="sm" className="w-full rounded-lg h-9 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">Contact Support</Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'Profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-10"
              >
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                      AR
                    </div>
                    <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-primary rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                      <Camera size={20} />
                    </button>
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <h3 className="text-2xl font-black text-text">Alex Rivera</h3>
                    <p className="text-text-muted font-medium">Creative Director • BMS Engage Agency</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">Active Account</span>
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Admin Access</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Personal Information</h4>
                    <div className="space-y-4">
                      <Input label="First Name" defaultValue="Alex" placeholder="Enter first name" />
                      <Input label="Last Name" defaultValue="Rivera" placeholder="Enter last name" />
                      <Input label="Email Address" defaultValue="alex@bms-agency.com" placeholder="Enter email" icon={<Mail size={16} />} />
                      <Input label="Phone Number" defaultValue="+1 (555) 000-0000" placeholder="Enter phone" icon={<Phone size={16} />} />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Location & Time</h4>
                    <div className="space-y-4">
                      <Input label="Country" defaultValue="United States" placeholder="Enter country" icon={<Globe size={16} />} />
                      <Input label="City" defaultValue="New York" placeholder="Enter city" icon={<MapPin size={16} />} />
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-text-muted uppercase tracking-widest">Timezone</label>
                        <select className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-sm font-bold text-text outline-none focus:border-primary/50 transition-all">
                          <option>Eastern Time (ET) - New York</option>
                          <option>Pacific Time (PT) - Los Angeles</option>
                          <option>Central Time (CT) - Chicago</option>
                          <option>UTC / Greenwich Mean Time</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Professional Bio</h4>
                  <textarea 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium text-text placeholder:text-text-muted outline-none focus:border-primary/50 min-h-[140px] resize-none transition-all"
                    defaultValue="Creative Director at BMS Engage Agency. Focused on building premium digital experiences for global brands through strategic social media management and AI-driven content creation."
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'Notifications' && (
              <motion.div 
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-text">Notification Preferences</h3>
                  <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest">Reset Defaults</Button>
                </div>
                
                <div className="space-y-2">
                  {[
                    { label: 'Post Published', desc: 'Receive an email when a scheduled post is successfully published.', icon: CheckCircle2, status: true },
                    { label: 'Weekly Analytics', desc: 'Get a summary of your performance metrics every Monday morning.', icon: TrendingUp, status: true },
                    { label: 'Account Security', desc: 'Alerts about new logins, password changes, and security updates.', icon: Shield, status: true },
                    { label: 'New Comments', desc: 'Notify me when someone comments on a managed post.', icon: MessageSquare, status: false },
                    { label: 'System Updates', desc: 'Stay informed about new features and maintenance schedules.', icon: Zap, status: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-6 border-b border-white/5 last:border-0 group">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                          item.status ? "bg-primary/10 text-primary" : "bg-white/5 text-text-muted"
                        )}>
                          <item.icon size={20} />
                        </div>
                        <div className="max-w-md">
                          <p className="font-bold text-text group-hover:text-primary transition-colors">{item.label}</p>
                          <p className="text-xs text-text-muted mt-1 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                      <button className={cn(
                        "w-14 h-7 rounded-full relative transition-all duration-300",
                        item.status ? "bg-primary" : "bg-white/10"
                      )}>
                        <div className={cn(
                          "absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300",
                          item.status ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'Security' && (
              <motion.div 
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-10"
              >
                <div className="space-y-6">
                  <h3 className="text-2xl font-black text-text">Security & Privacy</h3>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="text-amber-500 shrink-0 mt-1" size={20} />
                    <div>
                      <p className="text-sm font-bold text-amber-500">Security Recommendation</p>
                      <p className="text-xs text-amber-500/80 mt-1 leading-relaxed">Your password was last changed 6 months ago. We recommend updating it periodically for better protection.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Change Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input label="Current Password" type="password" placeholder="••••••••" icon={<Lock size={16} />} />
                      <div className="hidden md:block" />
                      <div className="relative">
                        <Input label="New Password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" icon={<Lock size={16} />} />
                        <button 
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-[34px] text-text-muted hover:text-text transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <Input label="Confirm New Password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" icon={<Lock size={16} />} />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/10 space-y-6">
                    <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Two-Factor Authentication</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[24px] group hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Smartphone size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-text">Authenticator App</p>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Recommended</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">Enable</Button>
                      </div>
                      <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[24px] group hover:border-primary/30 transition-all opacity-50">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/5 text-text-muted rounded-2xl flex items-center justify-center">
                            <Mail size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-text">SMS Verification</p>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Less Secure</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" disabled className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">Enable</Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/10 space-y-6">
                    <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Login History</h4>
                    <div className="space-y-3">
                      {[
                        { device: 'MacBook Pro 16"', location: 'New York, USA', time: 'Active Now', icon: Smartphone },
                        { device: 'iPhone 15 Pro', location: 'New York, USA', time: '2 hours ago', icon: Smartphone },
                        { device: 'Chrome on Windows', location: 'London, UK', time: 'Yesterday', icon: Globe },
                      ].map((session, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <session.icon size={18} className="text-text-muted" />
                            <div>
                              <p className="text-sm font-bold text-text">{session.device}</p>
                              <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{session.location}</p>
                            </div>
                          </div>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                            session.time === 'Active Now' ? "bg-emerald-500/10 text-emerald-500" : "bg-white/10 text-text-muted"
                          )}>
                            {session.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Agency Profile' && (
              <motion.div 
                key="agency"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-10"
              >
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-32 h-32 rounded-[40px] bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-text-muted hover:border-primary/50 hover:text-primary transition-all cursor-pointer group">
                    <Building2 size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Logo</span>
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <h3 className="text-2xl font-black text-text">BMS Engage Agency</h3>
                    <p className="text-text-muted font-medium">Full-service digital marketing & social management</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-2">
                      <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Agency Plan</span>
                      <span className="px-3 py-1 bg-white/10 text-text-muted text-[10px] font-black uppercase tracking-widest rounded-full">Est. 2022</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Input label="Agency Name" defaultValue="BMS Engage Agency" icon={<Building2 size={16} />} />
                    <Input label="Website URL" defaultValue="https://bms-engage.com" icon={<Globe size={16} />} />
                  </div>
                  <div className="space-y-4">
                    <Input label="Industry" defaultValue="Marketing & Advertising" icon={<Briefcase size={16} />} />
                    <Input label="Team Size" defaultValue="11 - 50 employees" icon={<Users size={16} />} />
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-6">
                  <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Team Members</h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Sarah Jenkins', role: 'Social Lead', status: 'Active' },
                      { name: 'Michael Chen', role: 'Content Creator', status: 'Active' },
                      { name: 'David Wilson', role: 'Analytics Expert', status: 'Pending' },
                    ].map((member, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text">{member.name}</p>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                            member.status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {member.status}
                          </span>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg bg-white/5 border-white/10">
                            <ArrowRight size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-white/20 bg-transparent hover:bg-white/5 text-text-muted font-bold">
                      <Plus size={18} className="mr-2" /> Invite Team Member
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'Billing' && (
              <motion.div 
                key="billing"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass border border-white/10 p-8 md:p-10 rounded-[32px] space-y-10"
              >
                <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30 rounded-[32px] gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Current Plan</p>
                    <h3 className="text-3xl font-black text-text">Agency Pro</h3>
                    <p className="text-text-muted font-medium">Billed annually • Next payment: Oct 12, 2024</p>
                  </div>
                  <div className="text-center md:text-right space-y-4">
                    <p className="text-4xl font-black text-text">$199<span className="text-lg text-text-muted">/mo</span></p>
                    <Button className="rounded-xl h-11 px-8 font-black shadow-xl shadow-primary/30">Upgrade Plan</Button>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Payment Methods</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[24px] group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                          <CreditCard size={24} className="text-text-muted" />
                        </div>
                        <div>
                          <p className="font-bold text-text">•••• •••• •••• 4242</p>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-0.5">Expires 12/26 • Visa</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">Primary</span>
                        <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">Edit</Button>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full h-14 rounded-2xl border-dashed border-white/20 bg-transparent hover:bg-white/5 text-text-muted font-bold">
                      <Plus size={18} className="mr-2" /> Add New Payment Method
                    </Button>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">Billing History</h4>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest bg-white/5 border-white/10">
                      <Download size={14} className="mr-2" /> Download All
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { id: 'INV-2024-001', date: 'Sep 12, 2024', amount: '$199.00', status: 'Paid' },
                      { id: 'INV-2024-002', date: 'Aug 12, 2024', amount: '$199.00', status: 'Paid' },
                      { id: 'INV-2024-003', date: 'Jul 12, 2024', amount: '$199.00', status: 'Paid' },
                    ].map((inv, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl group hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-4">
                          <History size={18} className="text-text-muted" />
                          <div>
                            <p className="text-sm font-bold text-text">{inv.id}</p>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{inv.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <p className="text-sm font-black text-text">{inv.amount}</p>
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-full">{inv.status}</span>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg bg-white/5 border-white/10">
                            <Download size={14} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
