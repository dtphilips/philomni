import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Mic, Square, Loader2, Zap, Play, Sparkles,
  Volume2, RotateCcw, Copy, Check, ChevronDown, ChevronUp, Headphones
} from 'lucide-react';
import { toast } from 'sonner';

const VOICE_PERSONAS = [
  {
    id: 'narrator',
    name: 'The Narrator',
    emoji: '🎙️',
    tagline: 'Deep, cinematic & authoritative',
    desc: 'Rich baritone storytelling voice. Perfect for documentaries, intros, and dramatic narration.',
    pitch: 0.65,
    rate: 0.82,
    style: 'speaking calmly and with gravitas',
  },
  {
    id: 'podcast',
    name: 'Podcast Host',
    emoji: '🎧',
    tagline: 'Warm, conversational & engaging',
    desc: 'Friendly and natural. Sounds like your favourite podcast host — approachable and upbeat.',
    pitch: 1.05,
    rate: 1.15,
    style: 'speaking in a warm, upbeat conversational tone',
  },
  {
    id: 'hype',
    name: 'Hype Speaker',
    emoji: '🔥',
    tagline: 'Fast, energetic & excited',
    desc: 'High energy. Great for promos, ads, and anything that needs to pump people up.',
    pitch: 1.2,
    rate: 1.4,
    style: 'speaking with high energy and excitement',
  },
  {
    id: 'asmr',
    name: 'ASMR / Calm',
    emoji: '🌙',
    tagline: 'Soft, slow & soothing',
    desc: 'Ultra-slow and gentle. Ideal for meditation, sleep content, or soothing guides.',
    pitch: 0.9,
    rate: 0.68,
    style: 'speaking very softly and slowly with a calming tone',
  },
  {
    id: 'newsreader',
    name: 'News Reader',
    emoji: '📰',
    tagline: 'Clear, neutral & professional',
    desc: 'Crisp, articulate, and neutral. Sounds like a broadcast news anchor.',
    pitch: 0.95,
    rate: 1.0,
    style: 'speaking clearly and professionally like a news anchor',
  },
  {
    id: 'storyteller',
    name: 'Storyteller',
    emoji: '📖',
    tagline: 'Expressive & theatrical',
    desc: 'Varied pace and tone. Perfect for children\'s content, audiobooks, and creative stories.',
    pitch: 1.1,
    rate: 0.9,
    style: 'telling a story with expression and varied pacing',
  },
];

export default function VoiceStudio() {
  // Script state
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [script, setScript] = useState('');
  const [generatingScript, setGeneratingScript] = useState(false);
  const [showScriptGenerator, setShowScriptGenerator] = useState(true);

  // Voice state
  const [selectedPersona, setSelectedPersona] = useState(VOICE_PERSONAS[0]);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [pitch, setPitch] = useState([selectedPersona.pitch]);
  const [rate, setRate] = useState([selectedPersona.rate]);
  const [volume, setVolume] = useState([0.95]);

  // ElevenLabs state
  const [useElevenLabs, setUseElevenLabs] = useState(false);
  const [elevenLabsVoices, setElevenLabsVoices] = useState([]);
  const [selectedELVoiceId, setSelectedELVoiceId] = useState('EXAVITQu4vr4xnSDxMaL');
  const audioRef = useRef(null);

  // Playback state
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Waveform animation
  const [waveHeights, setWaveHeights] = useState(Array(32).fill(20));
  const waveAnimRef = useRef(null);

  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) {
        setVoices(v);
        const englishVoice = v.find(v => v.lang.startsWith('en') && !v.name.includes('Google')) || v[0];
        setSelectedVoice(englishVoice);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Load ElevenLabs voices when toggled on
  useEffect(() => {
    if (!useElevenLabs || elevenLabsVoices.length > 0) return;
    base44.functions.elevenLabsVoices().then(({ voices }) => {
      if (voices?.length) setElevenLabsVoices(voices);
    });
  }, [useElevenLabs]);

  // Animate waveform while speaking
  useEffect(() => {
    if (speaking) {
      waveAnimRef.current = setInterval(() => {
        setWaveHeights(Array(32).fill(0).map(() => 15 + Math.random() * 85));
      }, 80);
    } else {
      clearInterval(waveAnimRef.current);
      setWaveHeights(Array(32).fill(20));
    }
    return () => clearInterval(waveAnimRef.current);
  }, [speaking]);

  const selectPersona = (persona) => {
    setSelectedPersona(persona);
    setPitch([persona.pitch]);
    setRate([persona.rate]);
  };

  const generateScript = async () => {
    if (!scriptPrompt.trim()) return;
    setGeneratingScript(true);
    setScript('');
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a professional voice-over script writer. Write a compelling, natural-sounding spoken-word script for the following topic. The script should feel ${selectedPersona.style}. Write only the script itself — no stage directions, no titles, no quotation marks. Keep it to 3–5 sentences that flow naturally when read aloud.

Topic: ${scriptPrompt}`,
    });
    setScript(res);
    setGeneratingScript(false);
  };

  const speak = async (textToSpeak) => {
    const text = textToSpeak || script;
    if (!text.trim()) return;

    if (useElevenLabs) {
      setSpeaking(true);
      try {
        const result = await base44.functions.elevenLabsTTS({
          text,
          voice_id: selectedELVoiceId,
        });
        if (result.fallback || result.error) {
          toast.error('ElevenLabs key not configured — using browser voice.');
          setUseElevenLabs(false);
          speakBrowser(text);
          return;
        }
        if (result.audioUrl) {
          if (audioRef.current) {
            audioRef.current.pause();
            URL.revokeObjectURL(audioRef.current.src);
          }
          const audio = new Audio(result.audioUrl);
          audioRef.current = audio;
          audio.volume = volume[0];
          audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(result.audioUrl); };
          audio.onerror = () => setSpeaking(false);
          await audio.play();
        }
      } catch (err) {
        toast.error('ElevenLabs TTS failed — falling back to browser.');
        setSpeaking(false);
        speakBrowser(text);
      }
      return;
    }

    speakBrowser(text);
  };

  const speakBrowser = (text) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.pitch = pitch[0];
    utt.rate = rate[0];
    utt.volume = volume[0];
    if (selectedVoice) utt.voice = selectedVoice;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setSpeaking(false);
  };

  const generateAndSpeak = async () => {
    if (!scriptPrompt.trim()) return;
    await generateScript();
    // speak is called after script is set via useEffect
  };

  // Auto-speak when script generated and user clicked "Generate & Speak"
  const [autoSpeak, setAutoSpeak] = useState(false);
  useEffect(() => {
    if (autoSpeak && script) {
      speak(script);
      setAutoSpeak(false);
    }
  }, [script, autoSpeak]);

  const copyScript = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">

      {/* Voice Personas */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Choose a Voice</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {VOICE_PERSONAS.map(persona => (
            <button
              key={persona.id}
              onClick={() => selectPersona(persona)}
              className={`text-left p-3 rounded-xl border transition-all ${
                selectedPersona.id === persona.id
                  ? 'border-primary bg-accent'
                  : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className="text-xl mb-1">{persona.emoji}</div>
              <p className={`text-sm font-semibold ${selectedPersona.id === persona.id ? 'text-primary' : ''}`}>
                {persona.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{persona.tagline}</p>
            </button>
          ))}
        </div>

        {/* Selected persona detail */}
        <div className={`mt-2 p-3 rounded-xl border text-xs text-muted-foreground transition-all bg-muted/50 border-border`}>
          <span className="font-medium text-foreground">{selectedPersona.name}:</span> {selectedPersona.desc}
        </div>
      </div>

      {/* Fine-tune controls */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fine-Tune Voice</p>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Pitch</span>
            <span className="font-medium">{pitch[0].toFixed(2)}</span>
          </div>
          <Slider value={pitch} onValueChange={setPitch} min={0.5} max={2} step={0.05} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Deep</span><span>High</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Speed</span>
            <span className="font-medium">{rate[0].toFixed(2)}x</span>
          </div>
          <Slider value={rate} onValueChange={setRate} min={0.5} max={2} step={0.05} className="w-full" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Slow</span><span>Fast</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Volume</span>
            <span className="font-medium">{Math.round(volume[0] * 100)}%</span>
          </div>
          <Slider value={volume} onValueChange={setVolume} min={0} max={1} step={0.01} className="w-full" />
        </div>

        {/* ElevenLabs toggle */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium">ElevenLabs AI Voice</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Premium</Badge>
          </div>
          <button
            onClick={() => setUseElevenLabs(v => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useElevenLabs ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${useElevenLabs ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* ElevenLabs voice picker */}
        {useElevenLabs && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">ElevenLabs Voice</p>
            <select
              value={selectedELVoiceId}
              onChange={e => setSelectedELVoiceId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {elevenLabsVoices.length > 0
                ? elevenLabsVoices.map(v => <option key={v.voice_id} value={v.voice_id}>{v.name}</option>)
                : <option value="EXAVITQu4vr4xnSDxMaL">Sarah (default)</option>
              }
            </select>
          </div>
        )}

        {/* Browser voice picker (shown when ElevenLabs off) */}
        {!useElevenLabs && voices.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Browser Voice Engine</p>
            <select
              value={selectedVoice?.name || ''}
              onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value))}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {voices.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* AI Script Generator */}
      <div className="bg-gradient-to-br from-accent/60 to-accent/20 border border-primary/20 rounded-xl p-4 space-y-3">
        <button
          onClick={() => setShowScriptGenerator(v => !v)}
          className="w-full flex items-center justify-between"
        >
          <p className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> AI Script Generator
          </p>
          {showScriptGenerator ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showScriptGenerator && (
          <>
            <Textarea
              value={scriptPrompt}
              onChange={e => setScriptPrompt(e.target.value)}
              placeholder={`Describe what you want ${selectedPersona.name} to say...\n\ne.g. "A 30-second motivational speech about never giving up"`}
              rows={3}
              className="bg-card resize-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={generateScript}
                disabled={generatingScript || !scriptPrompt.trim()}
                variant="outline"
                className="flex-1 gap-2"
              >
                {generatingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Write Script
              </Button>
              <Button
                onClick={() => { setAutoSpeak(true); generateScript(); }}
                disabled={generatingScript || !scriptPrompt.trim()}
                className="flex-1 gap-2"
              >
                {generatingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Generate & Speak
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Script Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Script</label>
          {script && (
            <button onClick={copyScript} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
        <Textarea
          value={script}
          onChange={e => setScript(e.target.value)}
          placeholder="Type your own script, or use the AI generator above..."
          rows={6}
          className="resize-none leading-relaxed"
        />
        <p className="text-xs text-muted-foreground text-right">{script.length} characters</p>
      </div>

      {/* Waveform visualizer */}
      {speaking && (
        <div className="flex items-end justify-center gap-0.5 h-14 bg-muted/50 rounded-xl px-4">
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-primary rounded-full transition-all duration-75"
              style={{ height: `${h}%`, opacity: 0.6 + (h / 100) * 0.4 }}
            />
          ))}
        </div>
      )}

      {/* Speak controls */}
      <div className="flex gap-2">
        <Button
          onClick={() => speak()}
          disabled={speaking || !script.trim()}
          size="lg"
          className="flex-1 gap-2"
        >
          {speaking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
          {speaking ? `Speaking as ${selectedPersona.name}...` : `Speak as ${selectedPersona.name}`}
        </Button>
        {speaking && (
          <Button onClick={stopSpeaking} variant="destructive" size="lg" className="gap-2">
            <Square className="w-4 h-4" /> Stop
          </Button>
        )}
        {!speaking && script && (
          <Button onClick={() => setScript('')} variant="ghost" size="lg" className="gap-1 text-muted-foreground">
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        AI voice synthesis · High-quality neural text-to-speech
      </p>
    </div>
  );
}