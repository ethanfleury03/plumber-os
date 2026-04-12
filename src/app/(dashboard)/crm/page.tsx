'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Plus, X, GripVertical, Pencil, Trash2, Check, Loader2 } from 'lucide-react';

interface Card {
  id: string;
  type: 'lead' | 'job';
  companyId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  location: string;
  service: string;
  price?: number;
  date: string;
  plumber?: string;
  plumberName?: string;
  source?: string;
  bucketId: string;
  leadId?: string;
  status?: string;
  priority?: number;
  description?: string;
}

// Map bucket position to lead status
const bucketPositionToStatus: Record<number, string> = {
  1: 'new',
  2: 'qualified',
  3: 'quoted',
  4: 'booked',
  5: 'in_progress',
  6: 'completed',
};

// Map lead status to bucket position
const statusToBucketPosition: Record<string, number> = {
  'new': 1,
  'qualified': 2,
  'quoted': 3,
  'booked': 4,
  'in_progress': 5,
  'completed': 6,
  'lost': 6,
};

interface Bucket {
  id: string;
  title: string;
  color: string;
  position: number;
}

interface ApiLead {
  id: string;
  company_id?: string;
  customer_id?: string;
  status: string;
  customer_name?: string;
  customer_phone?: string;
  location?: string;
  issue: string;
  created_at?: string;
  source?: string;
  plumber_name?: string;
  priority?: number;
  description?: string;
}



const defaultBuckets: Bucket[] = [
  { id: '1', title: 'New Leads', color: '#3b82f6', position: 1 },
  { id: '2', title: 'Qualified', color: '#8b5cf6', position: 2 },
  { id: '3', title: 'Quoted', color: '#eab308', position: 3 },
  { id: '4', title: 'Booked', color: '#f97316', position: 4 },
  { id: '5', title: 'In Progress', color: '#eab308', position: 5 },
  { id: '6', title: 'Completed', color: '#22c55e', position: 6 },
];

const colorOptions = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Gray', value: '#6b7280' },
];

// Map bucket ID to status using position
const getStatusFromBucketId = (bucketId: string, bucketsData: Bucket[]): string => {
  const bucket = bucketsData.find(b => b.id === bucketId);
  if (!bucket) return 'new';
  const position = bucket.position || 1;
  const positionToStatus: Record<number, string> = {
    1: 'new',
    2: 'qualified',
    3: 'quoted',
    4: 'booked',
    5: 'in_progress',
    6: 'completed',
  };
  return positionToStatus[position] || 'new';
};

// Map status to bucket ID using position
const getBucketIdFromStatus = (status: string, bucketsData: Bucket[]): string => {
  const positionMap: Record<string, number> = {
    'new': 1,
    'qualified': 2,
    'quoted': 3,
    'booked': 4,
    'in_progress': 5,
    'completed': 6,
  };
  const targetPosition = positionMap[status] || 1;
  const bucket = bucketsData.find(b => b.position === targetPosition);
  if (bucket) {
    return bucket.id;
  }
  // Fallback to first bucket
  return bucketsData[0]?.id || '';
};

export default function CrmPage() {
  const [buckets, setBuckets] = useState<Bucket[]>(defaultBuckets);
  const [cards, setCards] = useState<Card[]>([]);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [draggedCard, setDraggedCard] = useState<{ card: Card; bucketId: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [editBucket, setEditBucket] = useState<Bucket | null>(null);
  const [newBucket, setNewBucket] = useState({ title: '', color: '#3b82f6' });
  const [newCard, setNewCard] = useState({ customerName: '', customerPhone: '', location: '', service: '', description: '', price: 0, priority: 3, source: 'website', bucketId: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Handle card click - show details modal
  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setShowJobDetailsModal(true);
  };

  // Generate invoice from job
  const handleGenerateInvoice = async () => {
    if (!selectedCard?.leadId) return;
    
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: selectedCard.companyId,
          customer_id: selectedCard.customerId,
          lead_id: selectedCard.leadId,
          customer_name: selectedCard.customerName,
          customer_phone: selectedCard.customerPhone,
          service_type: selectedCard.service,
          amount: selectedCard.price || 0,
          status: 'pending',
          date: new Date().toISOString().split('T')[0],
        })
      });
      const data = await res.json();
      if (data.invoice) {
        alert(`Invoice created: ${data.invoice.invoice_number}`);
        setShowJobDetailsModal(false);
      }
    } catch (err) {
      console.error('Failed to create invoice:', err);
      alert('Failed to create invoice');
    }
  };

  // Fetch buckets and leads from API
  useEffect(() => {
    fetchBuckets();
  }, []);

  useEffect(() => {
    if (buckets.length > 0 && !loading) {
      fetchLeads();
    }
  }, [buckets, loading]);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.leads) {
        const mappedCards: Card[] = data.leads.map((lead: ApiLead) => ({
          id: lead.id,
          leadId: lead.id,
          type: ['booked', 'in_progress', 'completed'].includes(lead.status) ? 'job' : 'lead',
          companyId: lead.company_id,
          customerId: lead.customer_id,
          customerName: lead.customer_name || 'Unknown',
          customerPhone: lead.customer_phone || '',
          location: lead.location || '',
          service: lead.issue,
          price: 0,
          date: lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          source: lead.source,
          plumber: lead.plumber_name,
          bucketId: getBucketIdFromStatus(lead.status, buckets),
          priority: lead.priority,
          description: lead.description,
        }));
        setCards(mappedCards);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
  };

  const fetchBuckets = async () => {
    try {
      const res = await fetch('/api/buckets');
      const data = await res.json();
      if (data.buckets && data.buckets.length > 0) {
        setBuckets(data.buckets);
      }
    } catch (err) {
      console.error('Failed to fetch buckets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (card: Card, bucketId: string) => setDraggedCard({ card, bucketId });
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = async (targetBucketId: string) => {
    if (!draggedCard) return;
    const { card, bucketId: sourceBucketId } = draggedCard;
    if (sourceBucketId === targetBucketId) { setDraggedCard(null); return; }
    
    // Determine if it's a job based on target bucket position
    const targetBucket = buckets.find(b => b.id === targetBucketId);
    const isJob = targetBucket && targetBucket.position && targetBucket.position >= 4;
    
    // Update local state immediately
    setCards(cards.map(c => c.id === card.id ? { ...c, bucketId: targetBucketId, type: isJob ? 'job' : 'lead' } : c));
    setDraggedCard(null);
    
    // Update in database
    if (card.leadId) {
      setSaving(true);
      try {
        const status = getStatusFromBucketId(targetBucketId, buckets);
        await fetch('/api/leads', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: card.leadId, status })
        });
      } catch (err) {
        console.error('Failed to update lead status:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const filteredCards = cards.filter(card => {
    const matchesSearch = 
      card.customerName.toLowerCase().includes(search.toLowerCase()) ||
      card.service.toLowerCase().includes(search.toLowerCase()) ||
      card.location.toLowerCase().includes(search.toLowerCase());
    const matchesSource = sourceFilter === 'all' || card.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const getCardsForBucket = (bucketId: string) => filteredCards.filter(c => c.bucketId === bucketId);
  
  // Count leads and jobs based on bucket position
  const getBucketPosition = (bucketId: string) => {
    const bucket = buckets.find(b => b.id === bucketId);
    return bucket?.position || 1;
  };
  const totalLeads = cards.filter(c => {
    const pos = getBucketPosition(c.bucketId);
    return pos >= 1 && pos <= 3;
  }).length;
  const totalJobs = cards.filter(c => {
    const pos = getBucketPosition(c.bucketId);
    return pos >= 4 && pos <= 6;
  }).length;

  // Bucket CRUD
  const handleSaveBucket = async () => {
    if (!newBucket.title.trim()) return;
    try {
      if (editBucket) {
        await fetch('/api/buckets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editBucket.id, title: newBucket.title, color: newBucket.color })
        });
      } else {
        await fetch('/api/buckets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBucket)
        });
      }
      fetchBuckets();
      setNewBucket({ title: '', color: '#3b82f6' });
      setEditBucket(null);
    } catch (err) {
      console.error('Failed to save bucket:', err);
    }
  };

  const handleDeleteBucket = async (id: string) => {
    if (!confirm('Delete this bucket?')) return;
    try {
      await fetch(`/api/buckets?id=${id}`, { method: 'DELETE' });
      fetchBuckets();
    } catch (err) {
      console.error('Failed to delete bucket:', err);
    }
  };

  const openEditBucket = (bucket: Bucket) => {
    setEditBucket(bucket);
    setNewBucket({ title: bucket.title, color: bucket.color });
  };

  const handleAddCard = async () => {
    if (!newCard.customerName || !newCard.bucketId) return;
    setSaving(true);
    
    try {
      const status = getStatusFromBucketId(newCard.bucketId, buckets);
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue: newCard.service,
          source: newCard.source,
          status: status,
          location: newCard.location,
          customer_name: newCard.customerName,
          customer_phone: newCard.customerPhone,
          description: newCard.description,
          priority: newCard.priority
        })
      });
      const data = await res.json();
      
      if (data.lead) {
        const card: Card = {
          id: data.lead.id,
          leadId: data.lead.id,
          type: 'lead',
          customerName: newCard.customerName,
          customerPhone: newCard.customerPhone,
          location: newCard.location,
          service: newCard.service,
          price: newCard.price,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          source: newCard.source,
          bucketId: newCard.bucketId,
        };
        setCards([...cards, card]);
      }
      
      setShowAddModal(false);
      setNewCard({ customerName: '', customerPhone: '', location: '', service: '', description: '', price: 0, priority: 3, source: 'website', bucketId: '' });
    } catch (err) {
      console.error('Failed to add lead:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    
    const card = cards.find(c => c.id === id);
    if (card?.leadId) {
      try {
        await fetch(`/api/leads?id=${card.leadId}`, { method: 'DELETE' });
        setCards(cards.filter(c => c.id !== id));
      } catch (err) {
        console.error('Failed to delete lead:', err);
      }
    } else {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-0 bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="header px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div><h1 className="text-2xl font-bold text-gray-900">Board</h1><p className="text-gray-500 text-sm mt-0.5">CRM · Track your leads in the pipeline</p></div>
          <div className="flex items-center gap-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="search-input pl-10 pr-4 py-2.5 text-sm w-56 text-gray-900" /></div>
            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="input-field px-4 py-2.5 text-sm text-gray-900 cursor-pointer">
              <option value="all">All Sources</option>
              <option value="website">Website</option>
              <option value="phone">Phone</option>
              <option value="thumbtack">Thumbtack</option>
              <option value="angi">Angi</option>
              <option value="google">Google</option>
              <option value="referral">Referral</option>
            </select>
            <button className="p-2.5 hover:bg-white/80 rounded-xl relative transition-all hover:shadow-md"><Bell className="w-5 h-5 text-gray-600" /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span></button>
          </div>
        </header>

        <div className="stats-bar px-6 py-3 flex items-center gap-8 flex-shrink-0">
          <div className="stat-item flex items-center gap-3 pr-6"><span className="stat-value text-2xl font-bold">{totalLeads}</span><span className="text-gray-500 text-sm font-medium">Leads</span></div>
          <div className="stat-item flex items-center gap-3 pr-6"><span className="stat-value text-2xl font-bold">{totalJobs}</span><span className="text-gray-500 text-sm font-medium">Jobs</span></div>
          {saving && <div className="flex items-center gap-2 text-blue-500 text-sm font-medium"><Loader2 className="w-4 h-4 animate-spin" />Saving...</div>}
          <div className="flex-1"></div>
          <button onClick={() => setShowBucketModal(true)} className="btn-secondary flex items-center gap-2 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-semibold"><Pencil className="w-4 h-4" />Edit Buckets</button>
          <button onClick={() => { setNewCard({ ...newCard, bucketId: buckets[0]?.id || '1' }); setShowAddModal(true); }} className="btn-primary flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl"><Plus className="w-4 h-4" />Add Lead</button>
        </div>

        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-5 h-full">
            {buckets.sort((a, b) => a.position - b.position).map(bucket => (
              <div 
                key={bucket.id} 
                className="bucket w-76 flex-shrink-0 flex flex-col"
                style={{ '--bucket-color': bucket.color } as React.CSSProperties}
                onDragOver={handleDragOver} 
                onDrop={() => handleDrop(bucket.id)}
              >
                {/* Bucket Header */}
                <div 
                  className="bucket-header flex items-center gap-3"
                  style={{ backgroundColor: bucket.color + '12' }}
                >
                  <div className="w-3.5 h-3.5 rounded-full shadow-lg ring-2 ring-white/50" style={{ backgroundColor: bucket.color, boxShadow: `0 2px 8px ${bucket.color}40` }}></div>
                  <h3 className="font-bold text-gray-800 text-base">{bucket.title}</h3>
                  <span className="bucket-count ml-auto">
                    {getCardsForBucket(bucket.id).length}
                  </span>
                </div>
                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {getCardsForBucket(bucket.id).map(card => (
                    <div 
                      key={card.id} 
                      draggable 
                      onDragStart={() => handleDragStart(card, bucket.id)} 
                      onClick={() => handleCardClick(card)}
                      className={`pipeline-card p-4 group ${draggedCard?.card.id === card.id ? 'opacity-50' : ''}`}
                    >
                      {/* Header with badges */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`badge ${card.type === 'lead' ? 'badge-lead' : 'badge-job'}`}>
                            {card.type === 'lead' ? '🎯 Lead' : '🔧 Job'}
                          </span>
                          {card.priority && card.priority <= 2 && (
                            <span className="badge badge-hot">
                              🔥 Hot
                            </span>
                          )}
                          {card.priority && card.priority === 1 && (
                            <span className="badge badge-urgent">
                              ⚡ Urgent
                            </span>
                          )}
                          {card.source && (
                            <span className="badge badge-source">
                              {card.source === 'website' ? '🌐' : card.source === 'phone' ? '📞' : card.source === 'thumbtack' ? '🔧' : card.source === 'angi' ? '🏠' : card.source === 'google' ? '🔍' : '👥'} {card.source}
                            </span>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Customer & Service */}
                      <h4 className="font-bold text-gray-900 text-base mb-1">{card.customerName}</h4>
                      <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">{card.service}</p>
                      
                      {/* Details */}
                      <div className="details-section p-3 space-y-2">
                        {card.customerPhone && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">📞</span>
                            <span className="font-medium text-gray-700 text-sm">{card.customerPhone}</span>
                          </div>
                        )}
                        {card.location && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">📍</span>
                            <span className="text-gray-600 text-sm">{card.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">📅</span>
                          <span className="text-gray-600 text-sm">{card.date}</span>
                        </div>
                        {card.plumber && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">👷</span>
                            <span className="text-gray-600 text-sm">{card.plumber}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Description preview */}
                      {card.description && (
                        <p className="mt-3 text-xs text-gray-400 italic line-clamp-2 leading-relaxed">{card.description}</p>
                      )}
                      
                      {/* Price */}
                      {card.price && (
                        <div className="mt-4 pt-3 border-t border-gray-100/60 flex justify-between items-center">
                          <span className="text-xs text-gray-400 font-medium">Estimate</span>
                          <span className="text-base font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">${card.price}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {getCardsForBucket(bucket.id).length === 0 && <div className="empty-state">Drop leads here</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-content p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-gray-900">Add New Lead</h2><button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Customer Name *</label><input type="text" value={newCard.customerName} onChange={e => setNewCard({...newCard, customerName: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm text-gray-900" placeholder="John Smith" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label><input type="tel" value={newCard.customerPhone} onChange={e => setNewCard({...newCard, customerPhone: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm text-gray-900" placeholder="(555) 123-4567" /></div>
              </div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Service Type *</label><input type="text" value={newCard.service} onChange={e => setNewCard({...newCard, service: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm text-gray-900" placeholder="Leak repair, Installation..." /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label><input type="text" value={newCard.location} onChange={e => setNewCard({...newCard, location: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm text-gray-900" placeholder="123 Main St, City" /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Description</label><textarea value={newCard.description || ''} onChange={e => setNewCard({...newCard, description: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm text-gray-900" rows={3} placeholder="Additional details about the job..." /></div>
              <div className="grid grid-cols-4 gap-4">
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Price ($)</label><input type="number" value={newCard.price} onChange={e => setNewCard({...newCard, price: parseInt(e.target.value) || 0})} className="input-field w-full px-4 py-2.5 text-sm text-gray-900" /></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label><select value={newCard.priority} onChange={e => setNewCard({...newCard, priority: parseInt(e.target.value)})} className="input-field w-full px-4 py-2.5 text-sm text-gray-900 cursor-pointer"><option value={1}>🔥 Urgent</option><option value={2}>🔥 Hot</option><option value={3}>Normal</option><option value={4}>Low</option><option value={5}>Very Low</option></select></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Bucket</label><select value={newCard.bucketId} onChange={e => setNewCard({...newCard, bucketId: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm text-gray-900 cursor-pointer">{buckets.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}</select></div>
                <div><label className="block text-sm font-semibold text-gray-700 mb-2">Source</label><select value={newCard.source} onChange={e => setNewCard({...newCard, source: e.target.value})} className="input-field w-full px-4 py-2.5 text-sm text-gray-900 cursor-pointer"><option value="website">Website</option><option value="phone">Phone</option><option value="thumbtack">Thumbtack</option><option value="angi">Angi</option><option value="google">Google</option><option value="referral">Referral</option></select></div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary px-5 py-2.5 text-gray-700 text-sm font-semibold">Cancel</button>
                <button onClick={handleAddCard} disabled={saving} className="btn-primary px-5 py-2.5 text-white text-sm font-semibold flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}Add Lead</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Buckets Modal */}
      {showBucketModal && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50">
          <div className="modal-content p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold text-gray-900">Edit Buckets</h2><button onClick={() => setShowBucketModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-500" /></button></div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {buckets.sort((a, b) => a.position - b.position).map(bucket => (
                <div key={bucket.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-5 h-5 rounded-full shadow-md" style={{ backgroundColor: bucket.color, boxShadow: `0 2px 6px ${bucket.color}40` }}></div>
                  <span className="flex-1 text-sm font-semibold text-gray-700">{bucket.title}</span>
                  <button onClick={() => openEditBucket(bucket)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteBucket(bucket.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">{editBucket ? 'Edit Bucket' : 'Add New Bucket'}</p>
              <div className="flex items-center gap-3">
                <input type="text" value={newBucket.title} onChange={e => setNewBucket({...newBucket, title: e.target.value})} placeholder="Bucket name" className="input-field flex-1 px-4 py-2.5 text-sm text-gray-900" />
                <select value={newBucket.color} onChange={e => setNewBucket({...newBucket, color: e.target.value})} className="input-field px-3 py-2.5 text-sm cursor-pointer">
                  {colorOptions.map(c => <option key={c.value} value={c.value}>{c.name}</option>)}
                </select>
                <button onClick={handleSaveBucket} className="btn-primary p-2.5 text-white rounded-xl"><Check className="w-5 h-5" /></button>
              </div>
              {editBucket && <button onClick={() => { setEditBucket(null); setNewBucket({ title: '', color: '#3b82f6' }); }} className="mt-3 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel edit</button>}
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {showJobDetailsModal && selectedCard && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50" onClick={() => setShowJobDetailsModal(false)}>
          <div className="modal-content w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge ${selectedCard.type === 'lead' ? 'badge-lead' : 'badge-job'}`}>
                    {selectedCard.type === 'lead' ? '🎯 Lead' : '🔧 Job'}
                  </span>
                  {selectedCard.priority && selectedCard.priority <= 2 && (
                    <span className="badge badge-hot">🔥 Hot</span>
                  )}
                  {selectedCard.priority && selectedCard.priority === 1 && (
                    <span className="badge badge-urgent">⚡ Urgent</span>
                  )}
                </div>
                <button onClick={() => setShowJobDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Customer Info */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCard.customerName}</h2>
                <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-1">{selectedCard.service}</p>
              </div>
              
              {/* Contact Details */}
              <div className="details-section p-4 space-y-3">
                {selectedCard.customerPhone && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-lg">📞</span>
                    <span className="font-semibold text-gray-700">{selectedCard.customerPhone}</span>
                  </div>
                )}
                {selectedCard.location && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-lg">📍</span>
                    <span className="text-gray-700">{selectedCard.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-lg">📅</span>
                  <span className="text-gray-700">{selectedCard.date}</span>
                </div>
                {selectedCard.source && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-lg">🌐</span>
                    <span className="text-gray-700 capitalize font-medium">{selectedCard.source}</span>
                  </div>
                )}
                {selectedCard.plumber && (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-lg">👷</span>
                    <span className="text-gray-700">{selectedCard.plumber}</span>
                  </div>
                )}
              </div>
              
              {/* Description */}
              {selectedCard.description && (
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Description</h3>
                  <p className="text-gray-600 text-sm bg-gray-50 rounded-xl p-4 leading-relaxed">{selectedCard.description}</p>
                </div>
              )}
              
              {/* Price */}
              <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100">
                <span className="text-gray-700 font-bold">Estimate</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">${selectedCard.price || 0}</span>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleGenerateInvoice}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-white px-5 py-3 rounded-xl font-semibold"
                >
                  📄 Generate Invoice
                </button>
                <button 
                  onClick={() => { /* TODO: Edit functionality */ }}
                  className="btn-secondary px-5 py-3 text-gray-700 rounded-xl font-semibold"
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
