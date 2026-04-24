import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Search, Heart, Trash2, Download, Loader2, Music, Filter, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AudioLibrary() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    genre: '',
    mood: '',
    tempo_range: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUser();
    loadAssets();
  }, []);

  const loadUser = async () => {
    try {
      const me = await base44.auth.me();
      setUser(me);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadAssets = async () => {
    try {
      setLoading(true);
      const items = await base44.entities.AudioAsset.filter(
        { owner_id: user?.id },
        '-created_date'
      );
      setAssets(items);
    } catch (error) {
      console.error('Failed to load assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0 || !user) return;

    setUploading(true);
    try {
      for (const file of files) {
        const res = await base44.integrations.Core.UploadFile({ file });

        // Create asset record
        const asset = await base44.entities.AudioAsset.create({
          owner_id: user.id,
          owner_name: user.full_name,
          title: file.name.replace(/\.[^/.]+$/, ''),
          audio_url: res.file_url,
          duration: 0,
          file_size: file.size,
          is_analyzed: false,
        });

        // Trigger analysis
        setAnalyzing(asset.id);
        try {
          await base44.functions.invoke('analyzeAudio', {
            audio_url: res.file_url,
            asset_id: asset.id,
          });
        } catch (error) {
          console.error('Analysis failed:', error);
        } finally {
          setAnalyzing(null);
        }
      }

      await loadAssets();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId) => {
    if (!confirm('Delete this audio asset?')) return;
    try {
      await base44.entities.AudioAsset.delete(assetId);
      loadAssets();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleToggleFavorite = async (asset) => {
    try {
      await base44.entities.AudioAsset.update(asset.id, {
        favorite: !asset.favorite,
      });
      loadAssets();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      !searchTerm ||
      asset.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.genre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.mood?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGenre = !filters.genre || asset.genre === filters.genre;
    const matchesMood = !filters.mood || asset.mood === filters.mood;
    const matchesTempo = !filters.tempo_range || asset.tempo_range === filters.tempo_range;

    return matchesSearch && matchesGenre && matchesMood && matchesTempo;
  });

  const genres = [...new Set(assets.map(a => a.genre).filter(Boolean))];
  const moods = [...new Set(assets.map(a => a.mood).filter(Boolean))];
  const tempos = [...new Set(assets.map(a => a.tempo_range).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Music className="w-6 h-6" />
            Audio Library
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {assets.length} {assets.length === 1 ? 'audio file' : 'audio files'}
          </p>
        </div>
        <label className="cursor-pointer">
          <Button className="gap-2" asChild>
            <span>
              <Upload className="w-4 h-4" />
              Upload Audio
            </span>
          </Button>
          <input
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={handleAudioUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, genre, mood..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10' : ''}
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="bg-muted/30 p-4 rounded-lg space-y-3 border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold">Genre</label>
                <select
                  value={filters.genre}
                  onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">All Genres</option>
                  {genres.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Mood</label>
                <select
                  value={filters.mood}
                  onChange={(e) => setFilters({ ...filters, mood: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">All Moods</option>
                  {moods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold">Tempo</label>
                <select
                  value={filters.tempo_range}
                  onChange={(e) => setFilters({ ...filters, tempo_range: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">All Tempos</option>
                  {tempos.map(t => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ genre: '', mood: '', tempo_range: '' })}
              className="text-xs"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-xl border border-border/50">
          <Music className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground mb-3">
            {assets.length === 0 ? 'No audio files yet.' : 'No results match your filters.'}
          </p>
          {assets.length === 0 && (
            <label className="cursor-pointer inline-block">
              <Button size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Your First Audio
              </Button>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleAudioUpload}
              />
            </label>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => (
            <div
              key={asset.id}
              className="bg-card border border-border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors group"
            >
              {/* Player */}
              <div className="bg-muted rounded-lg p-3">
                <audio
                  src={asset.audio_url}
                  controls
                  className="w-full h-8"
                  onLoadedMetadata={(e) => {
                    if (asset.duration === 0) {
                      base44.entities.AudioAsset.update(asset.id, {
                        duration: e.currentTarget.duration,
                      });
                    }
                  }}
                />
              </div>

              {/* Title & Analysis Status */}
              <div>
                <h3 className="font-semibold truncate">{asset.title}</h3>
                {asset.is_analyzed ? (
                  <p className="text-xs text-green-600 mt-0.5">✓ Analyzed</p>
                ) : analyzing === asset.id ? (
                  <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Pending analysis</p>
                )}
              </div>

              {/* Analysis Tags */}
              {asset.is_analyzed && (
                <div className="space-y-2">
                  {asset.genre && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Genre:</span>
                      <Badge variant="secondary" className="text-xs">
                        {asset.genre}
                      </Badge>
                    </div>
                  )}

                  {asset.mood && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Mood:</span>
                      <Badge variant="outline" className="text-xs">
                        {asset.mood}
                      </Badge>
                    </div>
                  )}

                  {asset.tempo && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Tempo:</span>
                      <Badge className="text-xs bg-primary/10 text-primary border-0">
                        {asset.tempo} BPM
                      </Badge>
                    </div>
                  )}

                  {asset.instrumentation?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {asset.instrumentation.slice(0, 2).map((instr, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {instr}
                        </Badge>
                      ))}
                      {asset.instrumentation.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{asset.instrumentation.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Stats */}
              {asset.is_analyzed && (
                <div className="text-xs text-muted-foreground">
                  Confidence: {asset.analysis_confidence}%
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <a
                  href={asset.audio_url}
                  download={asset.title}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </Button>
                </a>
                <button
                  onClick={() => handleToggleFavorite(asset)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Heart
                    className={cn(
                      'w-4 h-4',
                      asset.favorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                    )}
                  />
                </button>
                <button
                  onClick={() => handleDelete(asset.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}