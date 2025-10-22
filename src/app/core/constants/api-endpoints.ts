// api-endpoints.ts - ADD FAVORITES
export const API_ENDPOINTS = {
  register: '/auth/register',
  login: '/auth/login',
  forgotPassword: '/auth/forgetpassword',
  resetPassword: '/auth/resetpassword',

  books: {
    getAll: '/books',
    getById: (id: string) => `/books/${id}`,
    create: '/books',
    update: (id: string) => `/books/${id}`,
    delete: (id: string) => `/books/${id}`,
    addOffer: (id: string) => `/books/${id}/offer`,
    setStockStatus: (id: string) => `/books/${id}/stock`,
  },

  cart: {
    get: '/cart',
    add: '/cart',
    update: '/cart',
    remove: (bookId: string) => `/cart/${bookId}`,
    clear: '/cart/clear'
  },

  favorites: {
    get: '/favorites',
    add: '/favorites',
    remove: (bookId: string) => `/favorites/${bookId}`,
    clear: '/favorites/clear'
  },

  orders: {
    create: '/orders',
    getAll: '/orders',
    getById: (id: string) => `/orders/${id}`,
    updateStatus: (id: string) => `/orders/${id}/status`,
    update: (id: string) => `/orders/${id}`,
    delete: (id: string) => `/orders/${id}`
  },
};
