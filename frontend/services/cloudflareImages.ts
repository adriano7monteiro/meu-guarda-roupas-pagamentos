/**
 * Cloudflare Images Upload Service
 * Upload direto do frontend para Cloudflare Images
 * Não passa pelo nosso backend, economizando infraestrutura
 */

const CLOUDFLARE_ACCOUNT_ID = '295ce07f8ee7124780b85ff6add6a897';
const CLOUDFLARE_API_TOKEN = 'K6Qi-JVAYilkWigwEmLiia3xyqw6CWghvTrDt1XK';
const CLOUDFLARE_DELIVERY_URL = 'https://imagedelivery.net/I8Y_iVICi37GKQADVwLKcw';

interface CloudflareUploadResponse {
  success: boolean;
  result?: {
    id: string;
    filename: string;
    uploaded: string;
    requireSignedURLs: boolean;
    variants: string[];
  };
  errors?: any[];
}

/**
 * Faz upload de imagem base64 para Cloudflare Images
 * @param base64Image Imagem em base64 (com ou sem prefixo data:)
 * @param fileName Nome do arquivo (opcional)
 * @returns URL pública da imagem no formato: https://imagedelivery.net/hash/id/public
 */
export async function uploadImageToCloudflare(
  base64Image: string,
  fileName: string = `image-${Date.now()}.jpg`
): Promise<string> {
  try {
    console.log('🚀 Iniciando upload para Cloudflare Images...');
    
    // Remove o prefixo data:image/...;base64, se existir
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    // Cria FormData para React Native
    const formData = new FormData();
    
    // No React Native, passamos um objeto com uri, type e name
    // Mas como temos base64, precisamos criar um formato aceito
    formData.append('file', {
      uri: `data:image/jpeg;base64,${base64Data}`,
      type: 'image/jpeg',
      name: fileName,
    } as any);
    
    // Upload para Cloudflare
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`;
    
    console.log('📤 Enviando para Cloudflare...');
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: formData,
    });
    
    const data: CloudflareUploadResponse = await response.json();
    
    if (!data.success || !data.result) {
      console.error('❌ Erro no upload Cloudflare:', data.errors);
      throw new Error(data.errors?.[0]?.message || 'Falha ao fazer upload da imagem');
    }
    
    // Monta URL pública da imagem
    // Formato: https://imagedelivery.net/hash/image-id/public
    const imageUrl = `${CLOUDFLARE_DELIVERY_URL}/${data.result.id}/public`;
    
    console.log('✅ Upload concluído! URL:', imageUrl);
    
    return imageUrl;
    
  } catch (error) {
    console.error('❌ Erro ao fazer upload para Cloudflare:', error);
    throw error;
  }
}

/**
 * Retorna URL da imagem com variante específica
 * Variantes: public, thumbnail, avatar, etc.
 * @param imageId ID da imagem no Cloudflare
 * @param variant Nome da variante (default: public)
 */
export function getCloudflareImageUrl(imageId: string, variant: string = 'public'): string {
  return `${CLOUDFLARE_DELIVERY_URL}/${imageId}/${variant}`;
}

/**
 * Extrai o image_id de uma URL do Cloudflare
 * @param url URL completa da imagem
 * @returns image_id ou null
 */
export function extractImageIdFromUrl(url: string): string | null {
  const match = url.match(/\/([a-zA-Z0-9_-]+)\/(public|thumbnail|avatar)/);
  return match ? match[1] : null;
}
