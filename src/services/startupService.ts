import api from './api';

export interface TeamMember {
  _id?: string;
  name: string;
  position: string;
  department: string;
  email: string;
  whatsapp: string;
  isActive: boolean;
  notificationPreference: 'email' | 'whatsapp' | 'both';
}

export interface Startup {
  id: string;
  name: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  logo: string | null;
  ceoName: string;
  ceoEmail: string;
  companyEmail: string;
  teamMembers: TeamMember[];
  createdAt: string;
}

export const startupService = {
  list: async (): Promise<Startup[]> => {
    const res = await api.get('/startups');
    return res.data.startups;
  },
  create: async (data: { name: string; description: string; phone: string; whatsapp: string; email: string; ceoName?: string; ceoEmail?: string; companyEmail?: string }): Promise<Startup> => {
    const res = await api.post('/startups', data);
    return res.data.startup;
  },
  update: async (id: string, data: { name?: string; description?: string; phone?: string; whatsapp?: string; email?: string; ceoName?: string; ceoEmail?: string; companyEmail?: string }): Promise<Startup> => {
    const res = await api.patch(`/startups/${id}`, data);
    return res.data.startup;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/startups/${id}`);
  },
  uploadLogo: async (id: string, file: File): Promise<Startup> => {
    const form = new FormData();
    form.append('logo', file);
    const res = await api.post(`/startups/${id}/logo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.startup;
  },
  listTeamMembers: async (id: string): Promise<TeamMember[]> => {
    const res = await api.get(`/startups/${id}/team-members`);
    return res.data.teamMembers;
  },
  addTeamMember: async (id: string, member: Omit<TeamMember, '_id'>): Promise<TeamMember> => {
    const res = await api.post(`/startups/${id}/team-members`, member);
    return res.data.member;
  },
  updateTeamMember: async (id: string, memberId: string, member: Partial<TeamMember>): Promise<TeamMember> => {
    const res = await api.patch(`/startups/${id}/team-members/${memberId}`, member);
    return res.data.member;
  },
  removeTeamMember: async (id: string, memberId: string): Promise<void> => {
    await api.delete(`/startups/${id}/team-members/${memberId}`);
  },
};
