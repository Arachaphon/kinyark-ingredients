export interface RecipeUser {
  id: string
  username: string
  avatarUrl: string | null
}

export interface RecipeImage {
  id: string
  imageUrl: string
}

export interface RecipeIngredientItem {
  id: string
  quantity: number
  unit: string
  ingredient: {
    id: number
    name: string
    categoryId: number | null
  }
}

export interface RecipeListItem {
  id: string
  recipeName: string
  rating: number
  favoriteCount: number
  createdAt: string
  bgColor: string | null
  visibility: string
  aiProvider?: string | null
  images: RecipeImage[]
  user: RecipeUser
  recipeIngredients: RecipeIngredientItem[]
  storePosts?: StorePostItem[]
}

export interface RecipeListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  userId?: string
}

export interface RecipeListResponse {
  data: RecipeListItem[]
  meta: RecipeListMeta
}

export interface RecipeEquipmentItem {
  id: string
  name: string
}

export interface RecipeVideo {
  id: string
  videoUrl: string
}

export interface ReviewItem {
  id: string
  userId: string
  rating: number
  comment: string | null
  isAnonymous: boolean
  createdAt: string
  user: RecipeUser
}

export interface StoreSetIngredient {
  name: string;
  quantity: string | number;
  unit: string;
}

export interface StorePostItem {
  id: string
  userId: string
  recipeId: string | null
  storeName: string
  sellingPrice: number
  storeDescription: string | null
  storeLocation: string | null
  contactInfo: string | null
  setIngredients: StoreSetIngredient[] | null
  visibility: string
  createdAt: string
  user: RecipeUser
  images: RecipeImage[]
  videos: RecipeVideo[]
}

export interface RecipeDetail {
  id: string
  userId: string
  recipeName: string
  description: string | null
  instructions: string | null
  rating: number
  reviewCount: number
  favoriteCount: number
  bgColor: string | null
  aiProvider: string | null
  visibility: string
  createdAt: string
  isFavorite: boolean
  user: RecipeUser
  recipeIngredients: RecipeIngredientItem[]
  equipmentItems: RecipeEquipmentItem[]
  images: RecipeImage[]
  videos: RecipeVideo[]
  reviews: ReviewItem[]
  storePosts: StorePostItem[]
  referenceRecipe?: {
    id: string
    recipeName: string
    user: {
      username: string
    }
  } | null
}

export interface RecipeDetailResponse {
  data: RecipeDetail
}

export interface FavoriteRecipe {
  id: string
  recipeName: string
  rating: number
  favoriteCount: number
  aiProvider?: string | null
  images: RecipeImage[]
  user: RecipeUser
  recipeIngredients: RecipeIngredientItem[]
}

export interface FavoriteItem {
  id: string
  userId: string
  recipeId: string
  createdAt: string
  recipe: FavoriteRecipe
}

export interface FavoriteListResponse {
  data: FavoriteItem[]
}
