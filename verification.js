/**
 * Verification Module - ID + Selfie Upload
 */

document.addEventListener('DOMContentLoaded', () => {
  requireAuth(async (user, profile) => {
    // If already verified, hide verification section
    if (profile?.verification_status === 'verified') {
      const verificationCard = document.getElementById('verification-card');
      if (verificationCard) {
        verificationCard.style.display = 'none';
      }
      return;
    }

    setupVerificationForm(user);
  });
});

/**
 * Setup verification form
 */
function setupVerificationForm(user) {
  const form = document.getElementById('verification-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError('verification-error');

    const idFile = document.getElementById('id-upload')?.files[0];
    const selfieFile = document.getElementById('selfie-upload')?.files[0];

    if (!idFile || !selfieFile) {
      showError('verification-error', '❌ Both ID and selfie required');
      return;
    }

    // Validate files
    const idValidation = validateFile(idFile);
    if (!idValidation.valid) {
      showError('verification-error', `❌ ID: ${idValidation.error}`);
      return;
    }

    const selfieValidation = validateFile(selfieFile);
    if (!selfieValidation.valid) {
      showError('verification-error', `❌ Selfie: ${selfieValidation.error}`);
      return;
    }

    try {
      // IMPORTANT: File path must be: folder/userid.extension
      // This allows the RLS policy to match auth.uid() with split_part(name, '/', 2)
      
      const fileExtension = idFile.type.split('/')[1] || 'jpg';
      const selfieExtension = selfieFile.type.split('/')[1] || 'jpg';
      
      // Upload ID - path: id/<user_id>.jpg
      const idFileName = `${user.id}.${fileExtension}`;
      const { data: idData, error: idUploadError } = await supabase.storage
        .from('verifications')
        .upload(`id/${idFileName}`, idFile, {
          upsert: true, // Replace if exists
          contentType: idFile.type,
        });

      if (idUploadError) {
        throw new Error(`ID upload failed: ${idUploadError.message}`);
      }

      // Upload selfie - path: selfie/<user_id>.jpg
      const selfieFileName = `${user.id}.${selfieExtension}`;
      const { data: selfieData, error: selfieUploadError } = await supabase.storage
        .from('verifications')
        .upload(`selfie/${selfieFileName}`, selfieFile, {
          upsert: true, // Replace if exists
          contentType: selfieFile.type,
        });

      if (selfieUploadError) {
        throw new Error(`Selfie upload failed: ${selfieUploadError.message}`);
      }

      // Update profile with verification status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          verification_status: 'pending',
          id_url: idData.path,
          selfie_url: selfieData.path,
          verification_submitted_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Success
      form.reset();
      
      const verificationCard = document.getElementById('verification-card');
      if (verificationCard) {
        verificationCard.style.display = 'none';
      }

      showSuccess('create-task-error', '✅ Verification submitted! Awaiting admin review...');
    } catch (error) {
      console.error('Verification error:', error);
      showError('verification-error', `❌ ${error.message || 'Verification failed'}`);
    }
  });
}
const user = (await supabase.auth.getUser()).data.user

await supabase.from("verifications").insert({
user_id: user.id,
id_card_url: idUpload.data.path,
selfie_url: selfieUpload.data.path,
status: "pending"
})