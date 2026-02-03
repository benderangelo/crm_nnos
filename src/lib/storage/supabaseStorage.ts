import { createClient } from '@/lib/supabase/client'

export async function uploadFile(file: File, path: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.storage
      .from('crm-anexos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) throw error

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('crm-anexos')
      .getPublicUrl(data.path)

    return {
      path: data.path,
      url: urlData.publicUrl,
    }
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    throw error
  }
}

export async function deleteFile(path: string) {
  const supabase = createClient()

  try {
    const { error } = await supabase.storage
      .from('crm-anexos')
      .remove([path])

    if (error) throw error
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error)
    throw error
  }
}

export async function downloadFile(path: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase.storage
      .from('crm-anexos')
      .download(path)

    if (error) throw error

    return data
  } catch (error) {
    console.error('Erro ao baixar arquivo:', error)
    throw error
  }
}
