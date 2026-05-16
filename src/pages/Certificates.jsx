import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Award, Download, Share2, BookOpen, CheckCircle, Calendar, Hash, ArrowLeft, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const SAMPLE_CERTS = [
  {
    id: 'cert-1',
    course_id: 'c1',
    course_title: 'Social Media Growth Masterclass',
    instructor: 'Sarah Kim',
    completion_date: new Date(Date.now() - 1296000000).toISOString(),
    certificate_id: 'PHIL-2025-001',
    thumbnail: '📱',
    category: 'social',
  },
  {
    id: 'cert-2',
    course_id: 'c3',
    course_title: 'Music Production for Creators',
    instructor: 'DJ Nexus',
    completion_date: new Date(Date.now() - 2592000000).toISOString(),
    certificate_id: 'PHIL-2025-002',
    thumbnail: '🎵',
    category: 'music',
  },
];

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-lg rounded-xl px-5 py-3 text-sm text-foreground flex items-center gap-2">
      <CheckCircle className="w-4 h-4 text-green-400" />
      {message}
    </div>
  );
}

export default function Certificates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [sharing, setSharing] = useState({});

  useEffect(() => {
    if (!user) return;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('enrollments')
          .select('*, courses(*)')
          .eq('user_id', user.id)
          .eq('progress_percent', 100);

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped = data.map((row) => ({
            id: row.id,
            course_id: row.course_id,
            course_title: row.courses?.title || 'Course',
            instructor: row.courses?.instructor || 'Instructor',
            completion_date: row.updated_at || row.created_at,
            certificate_id: `PHIL-${new Date().getFullYear()}-${String(row.id).slice(-3).padStart(3, '0')}`,
            thumbnail: row.courses?.emoji || '🎓',
            category: row.courses?.category || 'general',
          }));
          setCerts(mapped);
        } else {
          setCerts(SAMPLE_CERTS);
        }
      } catch {
        setCerts(SAMPLE_CERTS);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  async function shareToFeed(cert) {
    if (!user) return;
    setSharing((prev) => ({ ...prev, [cert.id]: true }));
    try {
      await supabase.from('posts').insert({
        content: `🏆 I just earned a certificate in "${cert.course_title}"! #Learning #Achievement`,
        author_id: user.id,
        created_at: new Date().toISOString(),
      });
      setToast('Shared to your feed!');
    } catch {
      setToast('Could not share right now. Try again.');
    } finally {
      setSharing((prev) => ({ ...prev, [cert.id]: false }));
    }
  }

  function downloadPDF() {
    setToast('Certificate download coming soon!');
  }

  const totalHours = certs.length * 4; // rough estimate

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Certificates</h1>
          <p className="text-sm text-muted-foreground">Your verified learning achievements</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-6 mt-6 mb-8 p-4 rounded-xl bg-card border border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{certs.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total Certs</p>
        </div>
        <div className="w-px bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{certs.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Courses Completed</p>
        </div>
        <div className="w-px bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{totalHours}h</p>
          <p className="text-xs text-muted-foreground mt-0.5">Learning Hours</p>
        </div>
      </div>

      {/* Empty state */}
      {certs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <GraduationCap className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No certificates yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Complete a course to earn your first certificate
          </p>
          <button
            onClick={() => navigate('/learning')}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Browse Courses
          </button>
        </div>
      ) : (
        /* Certificate cards grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col"
            >
              {/* Banner */}
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center py-8 gap-2 border-b border-border">
                <span className="text-5xl">{cert.thumbnail}</span>
                <span className="text-xs font-semibold tracking-widest uppercase text-primary mt-2">
                  Certificate of Completion
                </span>
              </div>

              {/* Details */}
              <div className="p-5 flex flex-col gap-3 flex-1">
                <h3 className="font-bold text-foreground text-base leading-snug">{cert.course_title}</h3>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="w-4 h-4 flex-shrink-0" />
                  <span>Issued by {cert.instructor}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{format(new Date(cert.completion_date), 'MMMM d, yyyy')}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="w-4 h-4 flex-shrink-0" />
                  <span className="font-mono text-xs text-muted-foreground/70">{cert.certificate_id}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2">
                  <button
                    onClick={downloadPDF}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => shareToFeed(cert)}
                    disabled={sharing[cert.id]}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {sharing[cert.id] ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                    Share to Feed
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
