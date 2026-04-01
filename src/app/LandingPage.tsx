import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Layers, Calendar, BarChart3, Share2, CheckCircle2,
  Zap, Shield, Globe, Users, Smartphone, Play, LayoutDashboard,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MarketingNavbar } from '../components/layout/MarketingNavbar';
import { Logo } from '../components/ui/Logo';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-background text-text selection:bg-primary/30 overflow-x-hidden">
      <MarketingNavbar />

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[700px] bg-primary/10 blur-[150px] rounded-full -z-10" />
        
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-8">
              Your Complete Media Operations System
            </span>
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter mb-10 leading-[0.85] text-text">
              The Operating System for <br />
              <span className="gradient-text">Creative Agencies.</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-muted max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
              BMS Engage is the all-in-one platform to organize your media, schedule posts across all platforms, and track performance with precision.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="lg" className="h-16 px-10 text-xl font-bold shadow-2xl shadow-primary/40">
                    <LayoutDashboard className="mr-2" size={22} /> Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/register">
                  <Button size="lg" className="h-16 px-10 text-xl font-bold shadow-2xl shadow-primary/40">
                    Start Free Trial <ArrowRight className="ml-2" size={24} />
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="lg" className="h-16 px-10 text-xl font-bold border-border hover:bg-primary/5">
                <Play className="mr-2 fill-current" size={20} /> Book Demo
              </Button>
            </div>
          </motion.div>

          {/* Platform Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-24 relative max-w-6xl mx-auto"
          >
            <div className="relative rounded-[40px] border border-border bg-card/50 p-3 shadow-[0_0_100px_-20px_rgba(65,1,121,0.3)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
              <img 
                src="https://picsum.photos/seed/dashboard-main/1600/1000" 
                alt="BMS Engage Dashboard Preview" 
                className="rounded-[32px] w-full opacity-90"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Floating Elements */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-12 top-1/4 w-64 p-6 rounded-3xl bg-card border border-border shadow-2xl hidden lg:block z-20"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Growth</p>
                  <p className="text-lg font-black text-text">+124%</p>
                </div>
              </div>
              <div className="h-2 w-full bg-background rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-emerald-500" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What BMS Does */}
      <section className="py-40 px-6 border-t border-border bg-primary/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-text">Built for the full <br />creative lifecycle.</h2>
            <p className="text-text-muted text-xl max-w-2xl mx-auto">From asset storage to final analytics, BMS Engage handles the heavy lifting.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Layers, title: "Media Management", desc: "Centralize your creative assets in a high-performance gallery." },
              { icon: Calendar, title: "Content Scheduling", desc: "Plan weeks of content in minutes with our visual calendar." },
              { icon: Share2, title: "Social Publishing", desc: "Direct API publishing to Instagram, TikTok, X, and LinkedIn." },
              { icon: BarChart3, title: "Analytics Tracking", desc: "Deep-dive performance metrics for every post and platform." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[40px] bg-card border border-border hover:border-primary/30 transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <item.icon size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-text">{item.title}</h3>
                <p className="text-text-muted leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-8 leading-tight text-text">Designed for the <br />modern media landscape.</h2>
            <div className="space-y-8">
              {[
                { title: "Media Agencies", desc: "Manage multiple clients and teams from one unified dashboard." },
                { title: "Content Creators", desc: "Scale your personal brand with professional-grade tools." },
                { title: "Global Brands", desc: "Maintain brand consistency across all international accounts." },
                { title: "Marketing Teams", desc: "Streamline internal approvals and collaborative workflows." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-all">
                    <CheckCircle2 className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1 text-text">{item.title}</h4>
                    <p className="text-text-muted text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full -z-10" />
            <div className="bg-card border border-border rounded-[40px] p-4 shadow-2xl">
              <img src="https://picsum.photos/seed/who/800/800" alt="Who it's for" className="rounded-[32px] w-full" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose BMS Engage */}
      <section className="py-40 px-6 bg-primary/5 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 text-text">Why BMS Engage?</h2>
            <p className="text-text-muted text-xl max-w-2xl mx-auto">The competitive edge your creative team has been waiting for.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Zap, title: "Centralized Workflow", desc: "Eliminate tool switching. Everything from asset to analytics is in one place." },
              { icon: Globe, title: "Automation First", desc: "Automate the boring stuff. Auto-tagging, auto-scheduling, and auto-reporting." },
              { icon: Users, title: "Team Collaboration", desc: "Built-in approval flows and role-based permissions for seamless teamwork." }
            ].map((item, i) => (
              <div key={i} className="text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-8">
                  <item.icon size={40} />
                </div>
                <h3 className="text-2xl font-bold text-text">{item.title}</h3>
                <p className="text-text-muted leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { quote: "BMS Engage has completely transformed how we handle client media. We've saved at least 20 hours a week on manual publishing.", author: "Sarah Jenkins", role: "Creative Director, Vibe Media" },
              { quote: "The most intuitive media OS I've ever used. The gallery and scheduler integration is a game-changer for our workflow.", author: "Marcus Chen", role: "Head of Social, Global Brands" }
            ].map((item, i) => (
              <div key={i} className="p-12 rounded-[40px] bg-card border border-border relative">
                <p className="text-2xl font-medium leading-relaxed mb-10 italic text-text/80">"{item.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20" />
                  <div>
                    <p className="font-bold text-text">{item.author}</p>
                    <p className="text-xs text-text-muted uppercase tracking-widest">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto bg-primary rounded-[60px] p-12 md:p-32 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10"
          >
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.85]">Ready to scale your <br />media operations?</h2>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-12 font-medium">
              Join 500+ agencies that are already using BMS Engage to power their creative workflows.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button size="lg" className="h-16 px-12 text-xl font-bold bg-white text-primary hover:bg-white/90">
                    <LayoutDashboard className="mr-2" size={20} /> Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="h-16 px-12 text-xl font-bold bg-white text-primary hover:bg-white/90">
                  Get Started Free
                </Button>
              )}
              <Button variant="outline" size="lg" className="h-16 px-12 text-xl font-bold border-white/20 hover:bg-white/10">
                Talk to Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-8">
              <Logo size="lg" />
            </div>
            <p className="text-text-muted max-w-xs leading-relaxed mb-8">
              The premium creative media agency platform for modern teams. Your complete media operations & content publishing system.
            </p>
            <div className="flex gap-4">
              {/* Social Icons Placeholder */}
              {[Globe, Share2, Smartphone].map((Icon, i) => (
                <div key={i} className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-text-muted hover:text-text hover:border-primary/30 transition-all cursor-pointer">
                  <Icon size={18} />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-8 uppercase tracking-widest text-text-muted text-xs">Platform</h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li><Link to="/features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/services" className="hover:text-primary transition-colors">Services</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/case-studies" className="hover:text-primary transition-colors">Case Studies</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-8 uppercase tracking-widest text-text-muted text-xs">Company</h4>
            <ul className="space-y-4 text-sm text-text-muted">
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border flex flex-col md:flex-row justify-between gap-4 text-xs text-text-muted">
          <p>© 2024 BMS Engage Creative Agency Platform. All rights reserved.</p>
          <p>Designed for high-performance creative teams.</p>
        </div>
      </footer>
    </div>
  );
}
