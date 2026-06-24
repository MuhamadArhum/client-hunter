import { useEffect, useState, useCallback } from 'react';
import { Mail, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import api from '@/services/api';
import { cn } from '@/lib/utils';

interface Lead {
  _id: string;
  companyName: string;
  phone?: string;
  email?: string;
}

interface OutreachRecord {
  _id: string;
  leadId?: { companyName?: string };
  type: string;
  status: string;
  subject?: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export default function Outreach() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const selectedLead = leads.find((l) => l._id === selectedLeadId);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailAlert, setEmailAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [waPhone, setWaPhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waLoading, setWaLoading] = useState(false);
  const [waAlert, setWaAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [history, setHistory] = useState<OutreachRecord[]>([]);
  const [histPagination, setHistPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, pages: 1 });
  const [histPage, setHistPage] = useState(1);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    api
      .get('/leads', { params: { limit: 100 } })
      .then((res) => setLeads(Array.isArray(res.data?.data) ? res.data.data : []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedLead?.phone) setWaPhone(selectedLead.phone);
  }, [selectedLeadId, selectedLead]);

  const fetchHistory = useCallback(() => {
    setHistLoading(true);
    api
      .get('/outreach', { params: { page: histPage, limit: 10 } })
      .then((res) => {
        setHistory(Array.isArray(res.data?.data) ? res.data.data : []);
        setHistPagination(res.data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
      })
      .catch(console.error)
      .finally(() => setHistLoading(false));
  }, [histPage]);

  const handleSendEmail = async () => {
    if (!selectedLeadId) { setEmailAlert({ type: 'error', msg: 'Please select a lead.' }); return; }
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setEmailAlert({ type: 'error', msg: 'Subject and message are required.' });
      return;
    }
    setEmailLoading(true);
    setEmailAlert(null);
    try {
      await api.post('/outreach/email', {
        leadId: selectedLeadId,
        subject: emailSubject,
        message: emailMessage,
      });
      setEmailAlert({ type: 'success', msg: 'Email sent successfully!' });
      setEmailSubject('');
      setEmailMessage('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setEmailAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to send email.' });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!selectedLeadId) { setWaAlert({ type: 'error', msg: 'Please select a lead.' }); return; }
    if (!waMessage.trim()) {
      setWaAlert({ type: 'error', msg: 'Message is required.' });
      return;
    }
    setWaLoading(true);
    setWaAlert(null);
    try {
      await api.post('/outreach/whatsapp', {
        leadId: selectedLeadId,
        message: waMessage,
        to: waPhone,
      });
      setWaAlert({ type: 'success', msg: 'WhatsApp message sent successfully!' });
      setWaMessage('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setWaAlert({ type: 'error', msg: err?.response?.data?.message || 'Failed to send message.' });
    } finally {
      setWaLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Outreach</h1>

      <Tabs defaultValue="send">
        <TabsList>
          <TabsTrigger value="send">Send Outreach</TabsTrigger>
          <TabsTrigger value="history" onClick={fetchHistory}>History</TabsTrigger>
        </TabsList>

        {/* Send Outreach Tab */}
        <TabsContent value="send" className="mt-6">
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-1">
              <Label>Select Lead</Label>
              <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lead to contact..." />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead._id} value={lead._id}>
                      {lead.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Tabs defaultValue="email">
                  <CardHeader className="pb-0">
                    <TabsList>
                      <TabsTrigger value="email">
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </TabsTrigger>
                      <TabsTrigger value="whatsapp">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        WhatsApp
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <TabsContent value="email" className="p-6 pt-4 space-y-4">
                    {emailAlert && (
                      <p className={cn(
                        'text-sm rounded p-2',
                        emailAlert.type === 'success'
                          ? 'text-cyan-700 bg-cyan-50'
                          : 'text-destructive bg-destructive/10',
                      )}>
                        {emailAlert.msg}
                      </p>
                    )}
                    <div className="space-y-1">
                      <Label>Subject</Label>
                      <Input
                        placeholder="Email subject..."
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Message</Label>
                      <Textarea
                        rows={8}
                        placeholder="Write your email message..."
                        value={emailMessage}
                        onChange={(e) => setEmailMessage(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSendEmail} disabled={emailLoading}>
                      <Mail className="mr-2 h-4 w-4" />
                      {emailLoading ? 'Sending...' : 'Send Email'}
                    </Button>
                  </TabsContent>

                  <TabsContent value="whatsapp" className="p-6 pt-4 space-y-4">
                    {waAlert && (
                      <p className={cn(
                        'text-sm rounded p-2',
                        waAlert.type === 'success'
                          ? 'text-cyan-700 bg-cyan-50'
                          : 'text-destructive bg-destructive/10',
                      )}>
                        {waAlert.msg}
                      </p>
                    )}
                    <div className="space-y-1">
                      <Label>Phone Number</Label>
                      <Input
                        placeholder="+1234567890"
                        value={waPhone}
                        onChange={(e) => setWaPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Message</Label>
                      <Textarea
                        rows={8}
                        placeholder="Write your WhatsApp message..."
                        value={waMessage}
                        onChange={(e) => setWaMessage(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSendWhatsApp} disabled={waLoading}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {waLoading ? 'Sending...' : 'Send WhatsApp'}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outreach History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {histLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(5)].map((__, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                        No outreach history yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">
                          {item.leadId?.companyName || '—'}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1.5 capitalize">
                            {item.type === 'email' ? (
                              <Mail className="h-3.5 w-3.5 text-cyan-500" />
                            ) : (
                              <MessageSquare className="h-3.5 w-3.5 text-violet-500" />
                            )}
                            {item.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            'text-xs',
                            item.status === 'sent'
                              ? 'bg-cyan-100 text-cyan-700'
                              : 'bg-rose-100 text-rose-700',
                          )}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {item.subject || '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {histPagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {histPagination.page} of {histPagination.pages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={histPage <= 1}
                  onClick={() => { setHistPage((p) => p - 1); fetchHistory(); }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={histPage >= histPagination.pages}
                  onClick={() => { setHistPage((p) => p + 1); fetchHistory(); }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
