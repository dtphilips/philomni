import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Upload, Loader2, X, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef(null);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [full_name, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setAvatarPreview(user.avatar_url || '');
      setFullName(user.full_name || '');
      setBio(user.bio || '');
      setWebsite(user.website || '');
      setBannerPreview(user.banner_url || '');
    }
  }, [user]);

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => setAvatarPreview(evt.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = (evt) => setBannerPreview(evt.target?.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let avatarUrl = user?.avatar_url || '';
      let bannerUrl = user?.banner_url || '';

      // Upload avatar if provided
      if (avatarFile) {
        const avatarRes = await base44.integrations.Core.UploadFile({ file: avatarFile });
        avatarUrl = avatarRes.file_url;
      }

      // Upload banner if provided
      if (bannerFile) {
        const res = await base44.integrations.Core.UploadFile({ file: bannerFile });
        bannerUrl = res.file_url;
      }

      // Update user profile
      await base44.auth.updateMe({
        avatar_url: avatarUrl,
        full_name: full_name.trim(),
        bio: bio.trim(),
        website: website.trim(),
        banner_url: bannerUrl,
      });

      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profile updated!');
      navigate('/profile');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/profile')}
          className="h-10 w-10"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
      </div>

      <div className="space-y-6">
        {/* Avatar Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0 cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-2xl">
                  {user?.full_name?.[0] || '?'}
                </div>
              )}
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Upload a new photo</p>
              <p className="text-xs text-muted-foreground mt-1">Click the circle to browse. JPG, PNG or GIF.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => avatarInputRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                Choose Photo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Full Name */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Full Name</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="full_name">Display name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Your full name"
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Profile Banner */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Banner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="h-48 rounded-lg border-2 border-dashed border-border bg-muted overflow-hidden">
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Upload className="w-8 h-8" />
                    <p className="text-sm">No banner uploaded</p>
                  </div>
                )}
              </div>
              <label className="absolute bottom-3 right-3 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
                <div className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
              </label>
              {bannerPreview && (
                <button
                  onClick={() => {
                    setBannerFile(null);
                    setBannerPreview('');
                  }}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/50 hover:bg-black/60 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x300px or larger
            </p>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="bio">Tell people about yourself</Label>
            <Textarea
              id="bio"
              placeholder="Share your story, interests, and expertise..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              className="min-h-[100px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/500 characters
            </p>
          </CardContent>
        </Card>

        {/* Website */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Website</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="website">Your website or portfolio link</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourwebsite.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Include the full URL with https://
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
