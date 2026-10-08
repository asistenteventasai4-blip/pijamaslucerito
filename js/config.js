/* ==========================================================================
   CONFIGURACIÓN DEL SITIO
   Lo que cambia por campaña, vendedora o cliente vive aquí, no en el HTML.
   Los enlaces del HTML ya traen valores por defecto: si este archivo falla,
   la página sigue funcionando.
   ========================================================================== */
window.SITE_CONFIG = {
    // Catálogo donde se hacen los pedidos
    catalogUrl: 'https://pijamasalmayor.com/lucerito',

    // WhatsApp por defecto (solo dígitos, con indicativo de país)
    whatsapp: '573222475957',

    // Atribución por vendedora: un enlace con ?ws=luisa usa el número de luisa.
    // Si el ws no existe aquí, se usa el número por defecto.
    vendedoras: {
        // luisa: '57300XXXXXXX',
    },

    // Redes sociales: deja '' para ocultar el botón
    social: {
        instagram: '',
        tiktok: ''
    },

    // Medición. Deja '' en lo que no se use: ese script no se carga.
    tracking: {
        metaPixelId: '',
        ga4Id: '',      // formato G-XXXXXXX
        clarityId: ''
    }
};
