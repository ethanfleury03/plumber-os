'use client';

import { useState } from 'react';
import { Bell, User, Building, CreditCard, Palette, Save, Loader2, Check } from 'lucide-react';



const settingsTabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Form state
  const [profile, setProfile] = useState({
    name: 'Akshay K.',
    email: 'akshay@plumberos.com',
    phone: '(555) 123-4567',
    role: 'Admin',
  });

  const [company, setCompany] = useState({
    name: 'Demo Plumbing Co.',
    address: '123 Main St, Brooklyn, NY 11201',
    phone: '(555) 987-6543',
    timezone: 'America/New_York',
  });

  const [notifications, setNotifications] = useState({
    emailLeads: true,
    emailJobs: true,
    emailInvoices: true,
    pushNewLead: true,
    pushJobAssigned: true,
    dailyDigest: false,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gray-100">
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            <p className="text-gray-500 text-sm">Manage your account and preferences</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-6 max-w-5xl mx-auto">
            {/* Sidebar Tabs */}
            <div className="w-48 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-2">
                {settingsTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              {activeTab === 'profile' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        AK
                      </div>
                      <div>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Change photo</button>
                        <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input 
                          type="text" 
                          value={profile.name}
                          onChange={e => setProfile({...profile, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <input 
                          type="text" 
                          value={profile.role}
                          onChange={e => setProfile({...profile, role: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input 
                          type="email" 
                          value={profile.email}
                          onChange={e => setProfile({...profile, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input 
                          type="tel" 
                          value={profile.phone}
                          onChange={e => setProfile({...profile, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'company' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input 
                        type="text" 
                        value={company.name}
                        onChange={e => setCompany({...company, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input 
                        type="text" 
                        value={company.address}
                        onChange={e => setCompany({...company, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input 
                          type="tel" 
                          value={company.phone}
                          onChange={e => setCompany({...company, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <select 
                          value={company.timezone}
                          onChange={e => setCompany({...company, timezone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        >
                          <option value="America/New_York">Eastern Time (ET)</option>
                          <option value="America/Chicago">Central Time (CT)</option>
                          <option value="America/Denver">Mountain Time (MT)</option>
                          <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Email Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'emailLeads', label: 'New leads assigned to me' },
                          { key: 'emailJobs', label: 'Job status updates' },
                          { key: 'emailInvoices', label: 'Invoice payments received' },
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notifications[item.key as keyof typeof notifications]}
                              onChange={e => setNotifications({...notifications, [item.key]: e.target.checked})}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Push Notifications</h3>
                      <div className="space-y-3">
                        {[
                          { key: 'pushNewLead', label: 'New lead assigned' },
                          { key: 'pushJobAssigned', label: 'Job assigned to me' },
                        ].map(item => (
                          <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={notifications[item.key as keyof typeof notifications]}
                              onChange={e => setNotifications({...notifications, [item.key]: e.target.checked})}
                              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{item.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={notifications.dailyDigest}
                          onChange={e => setNotifications({...notifications, dailyDigest: e.target.checked})}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Receive daily digest email</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing & Subscription</h2>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-blue-900">Pro Plan</h3>
                          <p className="text-sm text-blue-700">$49/month • Unlimited leads</p>
                        </div>
                        <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">Active</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Method</h3>
                      <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-900">•••• 4242</span>
                        <span className="text-xs text-gray-500">Expires 12/26</span>
                        <button className="ml-auto text-sm text-blue-600 hover:text-blue-700">Update</button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Billing History</h3>
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2 font-medium text-gray-600">Date</th>
                              <th className="text-left px-4 py-2 font-medium text-gray-600">Amount</th>
                              <th className="text-left px-4 py-2 font-medium text-gray-600">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { date: 'Jan 15, 2026', amount: '$49.00', status: 'Paid' },
                              { date: 'Dec 15, 2025', amount: '$49.00', status: 'Paid' },
                              { date: 'Nov 15, 2025', amount: '$49.00', status: 'Paid' },
                            ].map((item, i) => (
                              <tr key={i} className="border-t border-gray-200">
                                <td className="px-4 py-2 text-gray-900">{item.date}</td>
                                <td className="px-4 py-2 text-gray-900">{item.amount}</td>
                                <td className="px-4 py-2"><span className="text-green-600">{item.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Theme</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {['Light', 'Dark', 'System'].map(theme => (
                          <button
                            key={theme}
                            className={`p-3 border rounded-lg text-sm font-medium ${
                              theme === 'Light' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Accent Color</h3>
                      <div className="flex gap-2">
                        {['#3b82f6', '#8b5cf6', '#22c55e', '#f97316', '#ef4444'].map(color => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full ${color === '#3b82f6' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
