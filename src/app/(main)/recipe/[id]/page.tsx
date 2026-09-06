/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
"use client";

import Image from "next/image";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useParams, useRouter } from "next/navigation";
import { Anuphan } from "next/font/google";
import { useAuth } from "@/context/AuthContext";
import type { RecipeDetail } from "@/types/recipes";
import { translateUnit } from "@/lib/units";

const anuphan = Anuphan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
});

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80";
const FALLBACK_AVATAR = "/photo/default-avatar.svg";

// 🤖 โปรไฟล์เจ้าของสูตรที่สร้างโดย AI
const AI_AUTHORS: Record<string, { name: string; avatar: string }> = {
  gemini: { name: "Gemini", avatar: "/ai/gemini.svg" },
  groq: { name: "Groq", avatar: "/ai/groq.svg" },
  deepseek: { name: "DeepSeek", avatar: "/ai/gemini.svg" },
};

function getAiAuthor(aiProvider?: string | null) {
  if (!aiProvider) return null;
  return AI_AUTHORS[aiProvider.toLowerCase()] ?? null;
}

// 🖼️ คลังรูปสำรองสำหรับสูตรจากหน้าค้นหา (AI Recommendation)
const FOOD_GALLERY_POOL = [
  "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80",
];

const SEASONING_KEYWORDS = [
  "ซีอิ๊ว", "น้ำปลา", "ซอส", "น้ำมัน", "พริกไทย", "น้ำเปล่า", "น้ำซุป", "น้ำตาล",
  "เกลือ", "ผงชูรส", "รสดี", "ซอยพริก", "น้ำมะนาว", "กะทิ", "เนย"
];

interface QueryRecipeData {
  title: string;
  author: string;
  authorAvatar: string;
  images: string[];
  videoUrl: string;
  rating: number;
  ingredients: string[];
  instructions: string[];
  reviews: any[];
  reviewCount: number;
}

function ImageCarousel({
  images,
  altText,
  themeColor = "#71B254",
}: {
  images: Array<{ id: string; imageUrl: string }>;
  altText: string;
  themeColor?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1)); };
  const handleNext = (e: React.MouseEvent) => { e.stopPropagation(); setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1)); };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-md border border-black/10 group bg-black/5">
        <Image src={images[currentIndex]?.imageUrl || FALLBACK_IMAGE} alt={`${altText} image ${currentIndex + 1}`} fill className="object-cover transition-all duration-300" sizes="(max-width: 1024px) 100vw, 50vw" priority />
        {images.length > 1 && (
          <>
            <button onClick={handlePrev} aria-label="รูปก่อนหน้า" className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm opacity-90 group-hover:opacity-100 hover:bg-black/70 hover:scale-110 transition z-10 shadow-md">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button onClick={handleNext} aria-label="รูปถัดไป" className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm opacity-90 group-hover:opacity-100 hover:bg-black/70 hover:scale-110 transition z-10 shadow-md">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </>
        )}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm shadow-sm z-10">{currentIndex + 1} / {images.length}</div>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-black/30 px-3 py-1 rounded-full backdrop-blur-xs">
            {images.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentIndex(idx)} aria-label={`ไปที่รูปที่ ${idx + 1}`} className={`transition-all rounded-full ${idx === currentIndex ? "w-5 h-2 bg-white shadow-sm" : "w-2 h-2 bg-white/50 hover:bg-white/80"}`} />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, idx) => (
            <button key={img.id || idx} onClick={() => setCurrentIndex(idx)} className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${idx === currentIndex ? "border-[#16A34A] scale-105 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"}`} style={{ borderColor: idx === currentIndex ? themeColor : "transparent" }}>
              <Image src={img.imageUrl} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ViewRecipePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const recipeId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(false);

  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [ratingValue, setRatingValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // 🌟 Ref สำหรับให้เลื่อนหน้าจอมายังจุดแสดงคอมเมนต์อัตโนมัติ
  const commentSectionRef = useRef<HTMLDivElement>(null);

  const [queryRecipe, setQueryRecipe] = useState<QueryRecipeData | null>(null);
  const [paramsChecked, setParamsChecked] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const myReview = useMemo(
    () => (user && recipe ? recipe.reviews.find((r: any) => r.userId === user.id) ?? null : null),
    [user, recipe]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const rawTitle = urlParams.get("title");

    if (!rawTitle) {
      setParamsChecked(true);
      return;
    }

    const queryTagsParam = urlParams.get("tags");
    const queryTags = queryTagsParam
      ? queryTagsParam.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    const queryImage = urlParams.get("image");

    const cleanMenuName = rawTitle
      .replace(/\s*\(.*?\)\s*/g, "")
      .replace(/(แซ่บเว่อร์|แซ่บเวอร์|ละมุนลิ้น|สูตรเด็ด|สูตรคุณแม่|อร่อย)/g, "")
      .trim();

    const freshIngredients: string[] = [];
    const seasoningIngredients: string[] = [];

    queryTags.forEach((tag) => {
      const isSeasoning = SEASONING_KEYWORDS.some((kw) => tag.includes(kw));
      if (isSeasoning) {
        seasoningIngredients.push(tag);
      } else {
        freshIngredients.push(tag);
      }
    });

    const mainFreshList =
      freshIngredients.length > 0 ? freshIngredients : ["ไก่", "ผักสด"];
    const mainFreshText = mainFreshList.join(", ");

    const defaultGallery = [
      queryImage || FOOD_GALLERY_POOL[0],
      FOOD_GALLERY_POOL[1],
      FOOD_GALLERY_POOL[2],
      FOOD_GALLERY_POOL[3],
    ];

    let dynamicVideoUrl = "https://www.youtube.com/embed/2v-N-GZ2p9Y";
    if (rawTitle.includes("ต้ม") || rawTitle.includes("แกง") || rawTitle.includes("ข่า") || rawTitle.includes("ยำ")) {
      dynamicVideoUrl = "https://www.youtube.com/embed/5qap5aO4i9A";
    } else if (rawTitle.includes("ผัด") || rawTitle.includes("กระเพรา") || rawTitle.includes("กะเพรา")) {
      dynamicVideoUrl = "https://www.youtube.com/embed/8-W6EwE0r_k";
    } else if (rawTitle.includes("ทอด") || rawTitle.includes("เจียว")) {
      dynamicVideoUrl = "https://www.youtube.com/embed/9Z9kQ7DcwjU";
    }

    const dynamicIngredients = [
      ...mainFreshList.map((item) => `${item} 200 กรัม`),
      ...(seasoningIngredients.length > 0 ? seasoningIngredients.map((item) => `${item} ตามชอบ`) : []),
      "ข่า ตะไคร้ ใบมะกรูด หอมแดง (สำหรับเมนูต้ม)",
      "กระเทียมสับ / พริกขี้หนูสวน 2 ช้อนโต๊ะ",
      "น้ำปลา / ซอสหอยนางรม / ซีอิ๊วขาว อย่างละ 1 ช้อนโต๊ะ",
      "น้ำมะนาวสด / น้ำตาลทราย ตามชอบ",
      "ผักชี / ต้นหอม สำหรับโรยหน้า",
    ];

    let dynamicInstructions: string[] = [];

    if (rawTitle.includes("ต้ม") || rawTitle.includes("ยำ") || rawTitle.includes("ข่า") || rawTitle.includes("แกง")) {
      dynamicInstructions = [
        `เตรียมวัตถุดิบสด: ล้างทำความสะอาด ${mainFreshText} แล้วหั่นชิ้นพอดีคำเตรียมไว้`,
        "ตั้งหม้อใช้ไฟปานกลาง ใส่กะทิหรือน้ำซุปต้มจนเริ่มเดือดปุดๆ",
        "ใส่ ข่า ตะไคร้ ใบมะกรูด หอมแดง และพริกขี้หนูทุบลงไป ต้มจนส่งกลิ่นหอมสมุนไพร",
        `ใส่ ${mainFreshText} ลงไปต้มในหม้อจนสุกนุ่ม (ใช้ไฟปานกลาง ไม่คนบ่อยเพื่อไม่ให้มีกลิ่นคาว)`,
        "ปรุงรสด้วยซีอิ๊วขาว ซอสหอยนางรม น้ำปลา น้ำมะนาว และพริกไทยดำ ชิมรสให้ได้ความกลมกล่อมตามชอบ",
        `ตัก ${cleanMenuName} ใส่ชาม โรยหน้าด้วยผักชี พร้อมเสิร์ฟขณะร้อนๆ`,
      ];
    } else if (rawTitle.includes("ผัด") || rawTitle.includes("กระเพรา") || rawTitle.includes("กะเพรา")) {
      dynamicInstructions = [
        `เตรียมวัตถุดิบสด: ล้างทำความสะอาด ${mainFreshText} แล้วหั่นชิ้นพอดีคำ`,
        "ตั้งกระทะใส่น้ำมันพืชใช้ไฟปานกลางค่อนไปทางแรง รอจนน้ำมันเริ่มร้อน",
        "ใส่กระเทียมและพริกขี้หนูสับลงไปผัดจนส่งกลิ่นหอมฉุน",
        `ใส่ ${mainFreshText} ลงไปผัดเร่งไฟแรงให้สุกทั่วกัน`,
        "ปรุงรสด้วยซอสหอยนางรม ซีอิ๊วขาว น้ำปลา และน้ำตาลทราย ผัดคลุกเคล้าให้เข้าเนื้อ",
        `ตัก ${cleanMenuName} ราดข้าวสวยร้อนๆ พร้อมเสิร์ฟ`,
      ];
    } else {
      dynamicInstructions = [
        `เตรียมวัตถุดิบสด: ล้างทำความสะอาด ${mainFreshText} แล้วหั่นชิ้นพอดีคำ`,
        "ตั้งกระทะหรือหม้อ ใส่น้ำมันพืชใช้ไฟปานกลางจนร้อนได้ที่",
        "ใส่กระเทียมสับลงไปผัดจนมีกลิ่นหอม",
        `ใส่ ${mainFreshText} ลงไปผัดและต้มจนสุกดี`,
        "ปรุงรสด้วยน้ำปลา ซอสหอยนางรม ซีอิ๊วขาว และพริกไทยดำ ชิมรสตามชอบ",
        `ตัก ${cleanMenuName} ใส่จาน พร้อมรับประทาน`,
      ];
    }

    // สร้างข้อมูลคอมเมนต์จำลองสำหรับสูตร AI ให้หน้าเว็บมีตัวอย่างการแสดงผล
    const mockAiReviews = [
      { id: "mock-r1", user: { username: "สายกินฟินเว่อร์", avatarUrl: FALLBACK_AVATAR }, rating: 5, comment: "สูตรนี้เข้าใจง่ายมากครับ ทำตามแล้วรสชาติออกมาดีเยี่ยมเลย", isAnonymous: false },
      { id: "mock-r2", user: { username: "แม่ครัวฝึกหัด", avatarUrl: FALLBACK_AVATAR }, rating: 4, comment: "ใช้เวลาเตรียมนิดหน่อย แต่ออกมาหน้าตาดี รสชาติถูกปากค่ะ", isAnonymous: false }
    ];

    setQueryRecipe({
      title: rawTitle,
      author: "Ratatouille_Cook",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      images: defaultGallery,
      videoUrl: dynamicVideoUrl,
      rating: 4.8,
      ingredients: dynamicIngredients,
      instructions: dynamicInstructions,
      reviews: mockAiReviews,
      reviewCount: mockAiReviews.length
    });
    setLoading(false);
    setParamsChecked(true);
  }, []);

  const fetchRecipe = useCallback(async () => {
    if (!recipeId) { setNotFound(true); setLoading(false); return; }
    setLoading(true); setNotFound(false); setError(false);

    try {
      const res = await fetch(`/api/recipes/${recipeId}`);

      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(true);
        setLoading(false);
        return;
      }

      const body = await res.json();

      if (body.data) {
        setRecipe(body.data as RecipeDetail);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => {
    if (!paramsChecked || queryRecipe) return;
    fetchRecipe();
  }, [paramsChecked, queryRecipe, fetchRecipe]);

  useEffect(() => {
    if (!queryRecipe || queryRecipe.images.length <= 1) return;
    const timer = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % queryRecipe.images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [queryRecipe]);

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => prev === 0 ? (queryRecipe?.images.length ?? 1) - 1 : prev - 1);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => prev === (queryRecipe?.images.length ?? 1) - 1 ? 0 : prev + 1);
  };

  const favPendingRef = useRef(false);
  const toggleFavorite = () => {
    if (!recipe || favPendingRef.current) return;
    favPendingRef.current = true;

    const flip = () =>
      setRecipe((prev) =>
        prev
          ? {
              ...prev,
              isFavorite: !prev.isFavorite,
              favoriteCount: Math.max(0, prev.favoriteCount + (!prev.isFavorite ? 1 : -1)),
            }
          : prev
      );

    flip();

    fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: recipe.id }),
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            window.alert("กรุณาเข้าสู่ระบบก่อนกดถูกใจ");
          } else {
            console.warn("Favorite API failed, reverting UI state:", res.status);
          }
          flip();
          return;
        }
        const json = await res.json();
        const favorited: unknown = json?.data?.favorited;
        const favoriteCount: unknown = json?.data?.favoriteCount;
        if (typeof favorited === "boolean" && typeof favoriteCount === "number") {
          setRecipe((prev) => (prev ? { ...prev, isFavorite: favorited, favoriteCount } : prev));
        }
      })
      .catch(() => {
        console.warn("Network error, reverting optimistic UI state");
        flip();
      })
      .finally(() => {
        favPendingRef.current = false;
      });
  };

  useEffect(() => {
    if (myReview) {
      setRatingValue(myReview.rating);
      setCommentText(myReview.comment ?? "");
    }
  }, [myReview?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const thaiReviewError = (status: number, message?: string) => {
    if (status === 401) return "กรุณาเข้าสู่ระบบก่อนส่งรีวิว";
    if (status === 409) return "คุณได้รีวิวสูตรนี้ไปแล้ว";
    if (message?.toLowerCase().includes("rating")) return "กรุณาเลือกคะแนนดาวก่อนส่งรีวิว";
    return message || "ไม่สามารถส่งรีวิวได้ กรุณาลองใหม่อีกครั้ง";
  };

  const submitReview = async () => {
    if (!commentText.trim() || !recipe || isSubmitting) return;

    if (!user) {
      setCommentError("กรุณาเข้าสู่ระบบก่อนส่งรีวิว");
      return;
    }
    if (ratingValue === 0) {
      setCommentError("กรุณาเลือกคะแนนดาวก่อนส่งรีวิว");
      return;
    }

    setIsSubmitting(true);
    setCommentError(null);

    const submittedComment = commentText.trim();
    const submittedRating = ratingValue;

    if (myReview) {
      try {
        const res = await fetch(`/api/reviews/${myReview.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: submittedRating, comment: submittedComment }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          setCommentError(thaiReviewError(res.status, errBody?.error));
          return;
        }

        const body = await res.json();
        const savedReview: any = body?.data;

        setRecipe((prev) => {
          if (!prev) return prev;
          const count = prev.reviewCount;
          const avg =
            count > 0
              ? Math.round(((prev.rating * count - myReview.rating + submittedRating) / count) * 10) / 10
              : prev.rating;
          return {
            ...prev,
            rating: avg,
            reviews: prev.reviews.map((r: any) =>
              r.id === myReview.id ? { ...r, ...savedReview, user: r.user } : r
            ),
          };
        });
      } catch (e) {
        console.error("Error updating review:", e);
        setCommentError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const newReview: any = {
      id: tempId,
      userId: user.id,
      user: {
        username: user.user_metadata?.username ?? "คุณ",
        avatarUrl: (user.user_metadata?.avatar_url as string) ?? FALLBACK_AVATAR,
      },
      isAnonymous: false,
      rating: submittedRating,
      comment: submittedComment,
    };

    const rollbackTempReview = () => {
      setRecipe((prev) => (prev ? { ...prev, reviews: prev.reviews.filter((r) => r.id !== tempId) } : prev));
    };

    setRecipe((prev) => (prev ? { ...prev, reviews: [newReview, ...prev.reviews] } : prev));

    setCommentText("");
    setRatingValue(0);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: recipe.id,
          rating: submittedRating,
          comment: submittedComment,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        rollbackTempReview();
        setCommentError(thaiReviewError(res.status, errBody?.error));
        return;
      }

      const body = await res.json();
      const savedReview: any = body?.data;

      setRecipe((prev) => {
        if (!prev) return prev;
        const newCount = prev.reviewCount + 1;
        const newAvg =
          newCount > 0
            ? Math.round(((prev.rating * prev.reviewCount + submittedRating) / newCount) * 10) / 10
            : prev.rating;
        return {
          ...prev,
          rating: newAvg,
          reviewCount: newCount,
          reviews: prev.reviews.map((r: any) =>
            r.id === tempId ? { ...r, ...savedReview, user: savedReview?.user ?? r.user } : r
          ),
        };
      });
    } catch (e) {
      console.error("Error submitting review:", e);
      rollbackTempReview();
      setCommentError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview || !recipe || isSubmitting) return;
    if (!window.confirm("ยืนยันการลบรีวิวของคุณหรือไม่?")) return;

    setIsSubmitting(true);
    setCommentError(null);

    try {
      const res = await fetch(`/api/reviews/${myReview.id}`, { method: "DELETE" });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        setCommentError(thaiReviewError(res.status, errBody?.error));
        return;
      }

      setRecipe((prev) => {
        if (!prev) return prev;
        const newCount = Math.max(0, prev.reviewCount - 1);
        const newAvg =
          newCount > 0
            ? Math.round(((prev.rating * prev.reviewCount - myReview.rating) / newCount) * 10) / 10
            : 0;
        return {
          ...prev,
          rating: newAvg,
          reviewCount: newCount,
          reviews: prev.reviews.filter((r: any) => r.id !== myReview.id),
        };
      });
      setCommentText("");
      setRatingValue(0);
    } catch (e) {
      console.error("Error deleting review:", e);
      setCommentError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={star <= rating ? "#F1C40F" : "none"} stroke={star <= rating ? "#F1C40F" : "#71B254"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        ))}
      </div>
    );
  };

  const renderInputStars = () => {
    return (
      <div className="flex items-center gap-1 cursor-pointer">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star} 
            onClick={() => { setRatingValue(star); setCommentError(null); }}
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill={star <= ratingValue ? "#F1C40F" : "none"} 
            stroke={star <= ratingValue ? "#F1C40F" : "#A5A5A5"} 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="hover:stroke-[#F1C40F] hover:fill-[#F1C40F] transition"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        ))}
      </div>
    );
  };

  const coverImage = recipe?.images[0]?.imageUrl ?? FALLBACK_IMAGE;
  const authorAvatar = recipe?.user?.avatarUrl ?? FALLBACK_AVATAR;
  const canSubmit = !!commentText.trim() && ratingValue > 0 && !isSubmitting;

  // 🌟 ฟังก์ชันจัดการปุ่มกดเปิดคอมเมนต์ พร้อมพาเลื่อนจอ (Auto-Scroll) ลงไปที่ช่องพิมพ์อัตโนมัติ
  const openCommentsAndScroll = () => {
    setIsCommentOpen(true);
    setTimeout(() => {
      commentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className={`min-h-screen bg-[#F5EFD7] pb-20 overflow-x-hidden ${anuphan.className}`}>
      <Navbar />
      <main className="w-[95%] max-w-[1000px] mx-auto px-4 mt-6">
        {queryRecipe ? (
          <>
            {/* ✨ โหมดสูตรแนะนำจากหน้าค้นหา/AI (ข้อมูลส่งมาทาง query params) */}
            <div className="bg-white border border-[#71B254] rounded-sm p-8 shadow-sm relative mb-6">
              <button
                onClick={() => router.back()}
                className="absolute top-4 left-6 w-8 h-8 bg-[#71B254] text-white rounded-full flex items-center justify-center hover:bg-[#5b9642] transition z-10 shadow-sm"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              <div className="flex flex-col md:flex-row gap-10 mt-14 md:mt-6">
                <div className="w-full md:w-[350px] flex-shrink-0 flex flex-col gap-3">
                  <div className="w-full h-[320px] relative overflow-hidden rounded-3xl group shadow-md bg-gray-100 flex items-center justify-center">
                    <img
                      src={queryRecipe.images[selectedImageIndex] || FOOD_GALLERY_POOL[0]}
                      alt={queryRecipe.title}
                      className="w-full h-full object-cover transition-all duration-500 ease-in-out"
                      onError={(e) => {
                        e.currentTarget.src = FOOD_GALLERY_POOL[0];
                      }}
                    />

                    {queryRecipe.images.length > 1 && (
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm shadow-md z-10"
                        aria-label="Previous Image"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                    )}

                    {queryRecipe.images.length > 1 && (
                      <button
                        onClick={handleNextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm shadow-md z-10"
                        aria-label="Next Image"
                      >
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                    )}

                    {queryRecipe.images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm z-10">
                        {queryRecipe.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`h-2 transition-all rounded-full ${
                              idx === selectedImageIndex ? "w-6 bg-[#71B254]" : "w-2 bg-white/70 hover:bg-white"
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}

                    <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
                      {selectedImageIndex + 1} / {queryRecipe.images.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {queryRecipe.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`h-16 rounded-xl overflow-hidden border-2 transition-all bg-gray-100 ${
                          selectedImageIndex === idx ? "border-[#71B254] scale-95 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={img || FOOD_GALLERY_POOL[0]}
                          alt={`รูปที่ ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = FOOD_GALLERY_POOL[0];
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-6">
                  <h1 className="text-4xl md:text-5xl font-bold text-[#71B254] leading-tight">
                    {queryRecipe.title}
                  </h1>

                  <div className="flex items-center gap-3">
                    <img src={queryRecipe.authorAvatar} alt="ผู้เขียน" width={32} height={32} className="rounded-full object-cover" />
                    <span className="font-bold text-gray-800 text-lg">{queryRecipe.author}</span>
                  </div>

                  <div className="flex items-center gap-8 mt-4">
                    <div className="flex gap-4">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="#FF0000" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:scale-110 transition">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                      <svg onClick={openCommentsAndScroll} width="28" height="28" viewBox="0 0 24 24" fill={isCommentOpen ? "#71B254" : "none"} stroke="#71B254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:scale-110 transition active:scale-95">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderStars(queryRecipe.rating)}
                      <span className="font-bold text-gray-800 text-lg ml-2">{queryRecipe.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">🥕 ส่วนผสม</h3>
                  <div className="flex flex-wrap gap-3">
                    {queryRecipe.ingredients.map((ing, idx) => (
                      <span key={idx} className="px-3 py-1.5 border border-[#71B254] rounded-md text-sm text-gray-800 bg-[#EAF5E4]/40 font-medium shadow-sm">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">🍲 วิธีทำ</h3>
                  <div className="border border-[#71B254] rounded-md p-6 bg-white shadow-sm">
                    <ol className="list-decimal pl-5 space-y-3 text-gray-800 text-base leading-relaxed">
                      {queryRecipe.instructions.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              {queryRecipe.videoUrl && (
                <div className="mt-10">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">📹 วิดีโอสอนทำอาหาร</h3>
                  <div className="border border-[#71B254] rounded-md p-4 bg-white shadow-sm">
                    <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black">
                      <iframe src={queryRecipe.videoUrl} title="Recipe Video" className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 🌟 พรีวิวคอมเมนต์ 1-2 รายการ (แสดงตอนยังไม่กดเปิดโหมดเต็ม) สำหรับ AI */}
            {!isCommentOpen && (
              <div className="w-full mt-4">
                {queryRecipe.reviews && queryRecipe.reviews.length > 0 ? (
                  <div 
                    onClick={openCommentsAndScroll}
                    className="bg-white border border-[#71B254]/30 rounded-2xl p-6 shadow-sm w-full cursor-pointer hover:border-[#71B254]/60 hover:bg-[#EAF5E4]/20 transition-all mb-6"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-lg font-bold text-[#5A9240] flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        ความคิดเห็นล่าสุด
                      </h3>
                      <span className="text-sm font-bold text-[#71B254] underline underline-offset-2">
                        ดูทั้งหมด ({queryRecipe.reviewCount})
                      </span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {queryRecipe.reviews.slice(0, 2).map((review: any) => (
                        <div key={review.id} className="flex gap-3">
                          <Image src={review.user?.avatarUrl ?? FALLBACK_AVATAR} alt="avatar" width={32} height={32} className="rounded-full object-cover shrink-0 border border-gray-100" />
                          <div className="flex flex-col w-full bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-gray-900">{review.isAnonymous ? "ผู้ไม่ประสงค์ออกนาม" : (review.user?.username ?? "ผู้ใช้")}</span>
                              {review.rating > 0 && (
                                <div className="flex items-center gap-0.5">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#F1C40F" stroke="#F1C40F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                  <span className="text-xs font-bold text-gray-700">{review.rating}</span>
                                </div>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm mt-1 line-clamp-2">{review.comment || "ไม่มีความคิดเห็น"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={openCommentsAndScroll}
                    className="bg-white border border-[#71B254]/30 rounded-2xl p-6 shadow-sm w-full flex items-center justify-between cursor-pointer hover:bg-[#EAF5E4]/40 transition-all mb-6"
                  >
                    <span className="text-gray-500 font-medium">ยังไม่มีความคิดเห็น มารีวิวเป็นคนแรกสิ!</span>
                    <span className="text-sm font-bold text-[#71B254]">เขียนความคิดเห็น ✍️</span>
                  </div>
                )}
              </div>
            )}

            {/* ความคิดเห็นฉบับเต็ม */}
            {isCommentOpen && (
              <div ref={commentSectionRef} className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm animate-fade-in origin-top scroll-mt-24">
                <h2 className="text-2xl font-bold text-[#71B254] mb-8">ความคิดเห็น ({queryRecipe.reviewCount})</h2>
                {queryRecipe.reviews && queryRecipe.reviews.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {queryRecipe.reviews.map((review: any) => (
                      <div key={review.id} className="flex gap-4 animate-fade-in">
                        <Image src={review.user?.avatarUrl ?? FALLBACK_AVATAR} alt={review.user?.username ?? "ผู้แสดงความคิดเห็น"} width={40} height={40} className="rounded-full object-cover shrink-0" />
                        <div className="flex flex-col w-full">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="font-bold text-gray-900">{review.isAnonymous ? "ผู้ไม่ประสงค์ออกนาม" : (review.user?.username ?? "ผู้ใช้")}</span>
                            {review.rating > 0 && renderStars(review.rating)}
                          </div>
                          <p className="text-gray-700 mt-1">{review.comment || "ไม่มีความคิดเห็น"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">ยังไม่มีความคิดเห็น มารีวิวเป็นคนแรกสิ!</p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* 📖 โหมดสูตรอาหารจริงจากฐานข้อมูล */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-12 h-12 border-4 border-[#71B254] border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-medium">กำลังโหลดสูตรอาหาร...</p>
              </div>
            )}

            {!loading && error && (
              <div className="bg-white border border-red-300 rounded-sm p-12 text-center shadow-sm">
                <p className="text-lg font-bold text-red-600">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
                <button onClick={fetchRecipe} className="mt-6 px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition">ลองอีกครั้ง</button>
              </div>
            )}

            {!loading && !error && notFound && (
              <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
                <p className="text-lg font-bold text-gray-800">ไม่พบสูตรอาหารนี้ หรือสูตรนี้ถูกตั้งเป็นส่วนตัว</p>
                <button onClick={() => router.back()} className="mt-6 px-6 py-2.5 bg-[#71B254] text-white rounded-full text-sm font-bold hover:bg-[#5b9642] transition">กลับไปหน้าก่อนหน้า</button>
              </div>
            )}

            {!loading && !error && !notFound && recipe && (
              <>
                {/* 🏪 กล่องเซ็ทอาหารร้านค้า */}
                {recipe.storePosts && recipe.storePosts.length > 0 && (() => {
                    const storePost = recipe.storePosts[0];
                    const storeName = storePost.storeName || "ร้านค้า";
                    const sellingPrice = storePost.sellingPrice || 0;
                    const storeDescription = storePost.storeDescription || "เซ็ทอาหารพิเศษจากทางร้าน คัดสรรวัตถุดิบสดใหม่พร้อมปรุง";
                    const storeImages = storePost.images && storePost.images.length > 0 ? storePost.images : recipe.images && recipe.images.length > 0 ? recipe.images : [{ id: "fallback", imageUrl: coverImage }];
                    const storeVideos = storePost.videos && storePost.videos.length > 0 ? storePost.videos : recipe.videos || [];
                    const storeUserAvatar = storePost.user?.avatarUrl ?? FALLBACK_AVATAR;
                    const storeUsername = storePost.user?.username ?? "store";

                    return (
                      <div className="bg-white border-2 border-[#16A34A] rounded-sm p-8 relative mb-6 animate-fade-in flex flex-col gap-8">
                        <div className="absolute top-4 right-4 bg-[#16A34A] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10"><span>รายละเอียดเซ็ทอาหารร้านค้า</span></div>
                        
                        <div className="flex flex-col gap-4 mt-12 md:mt-6 w-full">
                          <div className="flex flex-col gap-6 bg-white p-6 rounded-2xl border border-[#16A34A]/30 w-full">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
                              <div className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl flex-shrink-0 min-w-[140px]">
                                <div className="w-16 h-16 relative"><Image src={storeUserAvatar} alt={storeName} fill className="rounded-full object-cover border-2 border-[#16A34A]" /></div>
                                <span className="text-xs font-extrabold text-white bg-[#16A34A] px-2.5 py-0.5 rounded-full">ร้านค้า</span>
                                <span className="font-extrabold text-[#15803D] text-sm text-center leading-tight">{storeName}</span>
                                <span className="text-xs text-gray-500 text-center font-medium">@{storeUsername}</span>
                              </div>
                              <div className="flex flex-col justify-between flex-1 gap-4 w-full text-center sm:text-left py-1">
                                <div>
                                  <span className="text-xs font-extrabold text-[#16A34A] tracking-wide uppercase bg-[#DCFCE7] px-3 py-1 rounded-md">เซ็ทอาหารพร้อมปรุง</span>
                                  <h1 className="text-3xl md:text-4xl font-bold text-[#15803D] leading-tight mt-2">เซ็ท {recipe.recipeName}</h1>
                                </div>
                                <div className="flex flex-col gap-3 text-left pt-1">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xs font-bold text-gray-500 shrink-0">ราคาขาย:</span>
                                    <span className="text-[#16A34A] text-2xl font-extrabold">฿ {sellingPrice} .-</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5 text-left w-full">
                                    <span className="text-xs font-bold text-gray-500">ช่องทางการติดต่อร้านค้า:</span>
                                    <span className="text-sm font-bold text-gray-800 break-words whitespace-pre-wrap">{storePost.contactInfo && storePost.contactInfo.trim() !== "" ? storePost.contactInfo : "ติดต่อทางร้านโดยตรง / โทร 081-234-5678"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {storeDescription && (
                              <div className="border-t border-[#16A34A]/20 pt-4 w-full"><p className="text-sm text-gray-700 leading-relaxed text-left">{storeDescription}</p></div>
                            )}

                            {storePost.setIngredients && Array.isArray(storePost.setIngredients) && storePost.setIngredients.length > 0 && (
                                <div className="border-t border-[#16A34A]/20 pt-4 w-full">
                                  <h4 className="text-sm font-bold text-[#15803D] mb-3 flex items-center gap-2"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>วัตถุดิบในเซ็ทอาหารนี้</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {storePost.setIngredients.map((ing: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 bg-white/50 p-2 rounded-md border border-[#16A34A]/10">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] shrink-0"></span><span className="font-semibold flex-1 truncate">{ing.name}</span><span className="text-gray-500 shrink-0 font-medium">{ing.quantity} {translateUnit(ing.unit) ? translateUnit(ing.unit) : ""}</span>
                                        </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        {((storeImages && storeImages.length > 0) || (storeVideos && storeVideos.length > 0)) && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
                            {storeImages && storeImages.length > 0 ? (
                              <div className="flex flex-col gap-3 w-full"><p className="text-xs font-bold text-[#16A34A]">รูปภาพเซ็ทอาหาร:</p><ImageCarousel images={storeImages} altText={storeName} themeColor="#16A34A" /></div>
                            ) : (<div className="hidden lg:block" />)}
                            {storeVideos && storeVideos.length > 0 && (
                              <div className="flex flex-col gap-3 w-full"><p className="text-xs font-bold text-[#16A34A]">วิดีโอแนะนำเซ็ทอาหาร:</p>
                                <div className="flex flex-col gap-3 w-full">
                                  {storeVideos.map((vid: any, idx: number) => (
<div key={vid.id || idx} className="w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden border border-black/10 bg-black flex items-center justify-center"><video src={vid.videoUrl} controls preload="metadata" poster={storeImages && storeImages.length > 0 ? storeImages[0].imageUrl : undefined} className="w-full h-full object-cover" /></div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {storePost.storeLocation && (
                        <div className="flex flex-col gap-2 bg-white p-5 rounded-2xl border border-[#BBF7D0] w-full">
                          <p className="text-xs font-bold text-[#16A34A] flex items-center justify-between">
                            <span>พิกัดและแผนที่ร้านค้า: {storePost.storeLocation ? `(${storePost.storeLocation})` : ""}</span>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storePost.storeLocation)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-[#16A34A] hover:underline"><span>เปิดนำทางใน Google Maps</span><span>↗</span></a>
                          </p>
                          <div className="w-full h-64 md:h-72 rounded-xl overflow-hidden border border-[#BBF7D0] relative bg-white mt-1">
                            <iframe title="Store Location Map" width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${encodeURIComponent(storePost.storeLocation || storeName || "มหาวิทยาลัยพะเยา")}&t=&z=15&ie=UTF8&iwloc=&output=embed`} />
                          </div>
                        </div>
                        )}
                      </div>
                    );
                  })()}

                {/* 📖 รายละเอียดสูตรอาหาร */}
                <div className="bg-white border border-[#71B254] rounded-sm p-8 relative mb-6 flex flex-col gap-8">
                  <div className="absolute top-4 right-4 bg-[#71B254] text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10"><span>รายละเอียดสูตรอาหาร</span></div>

                  <div className="flex flex-col gap-4 mt-12 md:mt-6 w-full">
                    <div className="flex flex-col gap-6 bg-white/90 p-6 rounded-2xl border border-[#71B254]/30 w-full">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 w-full">
                        <div className="flex flex-col items-center gap-2 px-5 py-4 rounded-xl flex-shrink-0 min-w-[140px]">
                          {(() => {
                            const aiAuthor = getAiAuthor(recipe.aiProvider);
                            if (aiAuthor) {
                              return (
                                <>
                                  <div className="w-16 h-16 relative"><Image src={aiAuthor.avatar} alt={`${aiAuthor.name} logo`} fill className="rounded-full object-cover border-2 border-[#71B254] bg-white" /></div>
                                  <span className="text-xs font-extrabold text-white bg-[#71B254] px-2.5 py-0.5 rounded-full">เจ้าของสูตร</span>
                                  <span className="font-extrabold text-gray-800 text-sm text-center leading-tight">{aiAuthor.name}</span>
                                </>
                              );
                            }
                            return (
                              <>
                                <div className="w-16 h-16 relative"><Image src={authorAvatar} alt="ผู้เขียน" fill className="rounded-full object-cover border-2 border-[#71B254]" /></div>
                                <span className="text-xs font-extrabold text-white bg-[#71B254] px-2.5 py-0.5 rounded-full">เจ้าของสูตร</span>
                                <span className="font-extrabold text-gray-800 text-sm text-center leading-tight">{recipe.user?.username ?? "ผู้ไม่ประสงค์ออกนาม"}</span>
                              </>
                            );
                          })()}
                        </div>

                        <div className="flex flex-col justify-between flex-1 gap-4 w-full text-center sm:text-left py-1">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-extrabold text-[#71B254] tracking-wide uppercase">สูตรอาหารแสนอร่อย</span>
                              {recipe.aiProvider && (
                                <span className="text-xs font-bold text-white px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#6F62E4] to-[#3AC9B5]">
                                  โดย {(() => {
                                      const p = recipe.aiProvider.toLowerCase();
                                      if (p === "gemini") return "Gemini";
                                      if (p === "groq") return "Groq";
                                      if (p === "deepseek") return "DeepSeek";
                                      return recipe.aiProvider;
                                    })()}
                                </span>
                              )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-[#5A9240] leading-tight mt-1">{recipe.recipeName}</h1>
                          </div>

                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                            <div className="flex items-center gap-2 bg-white border border-[#71B254]/30 px-3.5 py-1.5 rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all" onClick={toggleFavorite}>
                              {recipe.isFavorite ? (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF0000" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                              ) : (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A5A5A5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hover:stroke-[#FF0000] transition-colors"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                              )}
                              <span className="font-bold text-gray-700 text-sm">{recipe.favoriteCount}</span>
                            </div>

                            {/* 🌟 กดแล้วพุ่งลงล่างทันที */}
                            <div onClick={openCommentsAndScroll} className="flex items-center gap-2 bg-white border border-[#71B254]/30 px-3.5 py-1.5 rounded-xl cursor-pointer hover:bg-[#EAF5E4]/50 transition">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill={isCommentOpen ? "#71B254" : "none"} stroke="#71B254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                              <span className="font-bold text-[#5A9240] text-xs">ความคิดเห็น</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white border border-[#71B254]/30 px-3.5 py-1.5 rounded-xl">
                              {renderStars(Math.round(recipe.rating))}
                              <span className="font-bold text-gray-800 text-sm ml-1">{recipe.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {recipe.description && (<div className="border-t border-[#71B254]/20 pt-4 w-full"><p className="text-sm text-gray-700 leading-relaxed w-full">{recipe.description}</p></div>)}
                    </div>
                  </div>

                  {((recipe.images && recipe.images.length > 0) || (recipe.videos && recipe.videos.length > 0)) && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
                      {recipe.images && recipe.images.length > 0 ? (
                        <div className="flex flex-col gap-3 w-full"><p className="text-xs font-bold text-[#71B254]">รูปภาพสูตรอาหาร:</p><ImageCarousel images={recipe.images} altText={recipe.recipeName} themeColor="#71B254" /></div>
                      ) : (<div className="hidden lg:block" />)}
                      {recipe.videos && recipe.videos.length > 0 && (
                        <div className="flex flex-col gap-3 w-full"><p className="text-xs font-bold text-[#71B254]">วิดีโอประกอบสูตรอาหาร:</p>
                          <div className="flex flex-col gap-3 w-full">
                            {recipe.videos.map((vid: any, idx: number) => (
                              <div key={vid.id || idx} className="w-full h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden border border-black/10 bg-black flex items-center justify-center"><video src={vid.videoUrl} controls preload="metadata" poster={recipe.images && recipe.images.length > 0 ? recipe.images[0].imageUrl : undefined} className="w-full h-full object-cover" /></div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-6 mt-2 flex flex-col w-full">
                    <div className="w-full p-6 rounded-2xl border border-[#71B254]/30">
                      <h3 className="text-xl font-bold text-[#5A9240] mb-4">{recipe.storePosts && recipe.storePosts.length > 0 ? "ส่วนผสมในเซ็ทขาย" : "ส่วนผสม"}</h3>
                      <div className="flex flex-wrap gap-2.5">
                        {(() => {
                          const sp = recipe.storePosts && recipe.storePosts.length > 0 ? recipe.storePosts[0] : null;
                          if (sp && sp.setIngredients && Array.isArray(sp.setIngredients) && sp.setIngredients.length > 0) {
                            return sp.setIngredients.map((ri: any, idx: number) => (
                              <span key={idx} className="px-3.5 py-1.5 border border-[#71B254]/40 rounded-xl text-sm font-medium text-gray-800 bg-white">
                                {ri.name}{ri.quantity && Number(ri.quantity) > 0 ? ` ${ri.quantity}${ri.unit && translateUnit(ri.unit) ? ` ${translateUnit(ri.unit)}` : ""}` : ""}
                              </span>
                            ));
                          } else {
                            return recipe.recipeIngredients.map((ri: any) => (
                              <span key={ri.id} className="px-3.5 py-1.5 border border-[#71B254]/40 rounded-xl text-sm font-medium text-gray-800 bg-white">
                                {ri.ingredient.name}{ri.quantity > 0 ? ` ${ri.quantity}${translateUnit(ri.unit) ? ` ${translateUnit(ri.unit)}` : ""}` : ""}
                              </span>
                            ));
                          }
                        })()}
                      </div>
                    </div>
                    <div className="w-full">
                      <h3 className="text-xl font-bold text-[#5A9240] mb-4">วิธีทำ</h3>
                      <div className="border border-[#71B254]/30 rounded-xl p-6 bg-white w-full">
                        {recipe.instructions && recipe.instructions.trim() !== "" ? (
                          <div className="text-gray-800 text-base leading-relaxed whitespace-pre-line w-full">{recipe.instructions}</div>
                        ) : (<p className="text-gray-500">ยังไม่มีวิธีทำสำหรับสูตรนี้</p>)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🌟 พรีวิวคอมเมนต์ 1-2 รายการแรก (แสดงตอนที่ยังไม่ได้เปิดคอมเมนต์ทั้งหมด) */}
                {!isCommentOpen && (
                  <div className="w-full mt-4">
                    {recipe.reviews && recipe.reviews.length > 0 ? (
                      <div 
                        onClick={openCommentsAndScroll}
                        className="bg-white border border-[#71B254]/30 rounded-2xl p-6 shadow-sm w-full cursor-pointer hover:border-[#71B254]/60 hover:bg-[#EAF5E4]/20 transition-all mb-6"
                      >
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-lg font-bold text-[#5A9240] flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            ความคิดเห็นล่าสุด
                          </h3>
                          <span className="text-sm font-bold text-[#71B254] underline underline-offset-2">
                            ดูทั้งหมด ({recipe.reviewCount})
                          </span>
                        </div>
                        <div className="flex flex-col gap-4">
                          {recipe.reviews.slice(0, 2).map((review: any) => (
                            <div key={review.id} className="flex gap-3">
                              <Image src={review.user?.avatarUrl ?? FALLBACK_AVATAR} alt="avatar" width={32} height={32} className="rounded-full object-cover shrink-0 border border-gray-100" />
                              <div className="flex flex-col w-full bg-gray-50/50 p-3 rounded-xl border border-gray-100/50">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-gray-900">{review.isAnonymous ? "ผู้ไม่ประสงค์ออกนาม" : (review.user?.username ?? "ผู้ใช้")}</span>
                                  {review.rating > 0 && (
                                    <div className="flex items-center gap-0.5">
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#F1C40F" stroke="#F1C40F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                      <span className="text-xs font-bold text-gray-700">{review.rating}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-gray-700 text-sm mt-1 line-clamp-2">{review.comment || "ไม่มีความคิดเห็น"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={openCommentsAndScroll}
                        className="bg-white border border-[#71B254]/30 rounded-2xl p-6 shadow-sm w-full flex items-center justify-between cursor-pointer hover:bg-[#EAF5E4]/40 transition-all mb-6"
                      >
                        <span className="text-gray-500 font-medium">ยังไม่มีความคิดเห็น มารีวิวเป็นคนแรกสิ!</span>
                        <span className="text-sm font-bold text-[#71B254]">เขียนความคิดเห็น ✍️</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ============================================================== */}
                {/* 💬 ส่วนแสดงความคิดเห็นฉบับเต็ม (มี Ref สำหรับ Scroll ลงมา) */}
                {/* ============================================================== */}
                {isCommentOpen && (
                  <div ref={commentSectionRef} className="bg-white border border-[#71B254] rounded-sm p-8 md:p-10 shadow-sm animate-fade-in origin-top scroll-mt-24">
                    <h2 className="text-2xl font-bold text-[#71B254] mb-8">ความคิดเห็น ({recipe.reviewCount})</h2>
                    
                    {/* 📝 กล่องพิมพ์คอมเมนต์ (Input & Submit) */}
                    <div className="pb-8 border-b border-gray-100 mb-8 flex gap-4 items-start">
                      <div className="flex flex-col w-full gap-3">
                        <span className="font-bold text-gray-900">{myReview ? "แก้ไขรีวิวของคุณ" : "เขียนความคิดเห็นของคุณ"}</span>
                        
                        {/* ระบบกดให้คะแนนดาว */}
                        <div className="flex items-center gap-4">
                          {renderInputStars()}
                          {ratingValue > 0 && <span className="text-xs text-[#F1C40F] font-bold">ให้ {ratingValue} ดาว</span>}
                        </div>
                        
                        {/* ช่องกรอกข้อความและปุ่มส่ง */}
                        <div className="relative w-full">
                          <input 
                            type="text" 
                            placeholder={myReview ? "แก้ไขความคิดเห็นของคุณที่นี่..." : "พิมพ์ความคิดเห็นของคุณที่นี่..."} 
                            value={commentText}
                            onChange={(e) => { setCommentText(e.target.value); setCommentError(null); }}
                            onKeyDown={(e) => e.key === 'Enter' && submitReview()}
                            disabled={isSubmitting}
                            className="w-full py-3 pl-4 pr-12 rounded-md bg-[#EAF5E4] border border-[#d2e8c5] text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#71B254] shadow-inner disabled:opacity-50" 
                          />
                          <button 
                            onClick={submitReview}
                            disabled={!canSubmit}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-all ${!canSubmit ? 'text-gray-400 cursor-not-allowed' : 'text-[#71B254] hover:text-[#5b9642] hover:scale-110 active:scale-95'}`}
                          >
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                          </button>
                        </div>

                        {/* ⚠️ ข้อความแจ้งเตือน (inline) */}
                        {commentError && (
                          <p className="text-sm font-bold text-red-600">{commentError}</p>
                        )}

                        {/* 🗑️ โซนจัดการรีวิวของตัวเอง */}
                        {myReview && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-500">คุณรีวิวสูตรนี้ไปแล้ว — สามารถแก้ไขหรือลบรีวิวได้</span>
                            <button
                              onClick={handleDeleteReview}
                              disabled={isSubmitting}
                              className="shrink-0 px-3 py-1.5 rounded-full border border-red-300 text-red-600 text-xs font-bold hover:bg-red-50 transition disabled:opacity-50"
                            >
                              ลบรีวิว
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 📋 รายการคอมเมนต์ทั้งหมด */}
                    {recipe.reviews && recipe.reviews.length > 0 ? (
                      <div className="flex flex-col gap-6">
                        {recipe.reviews.map((review: any) => (
                          <div key={review.id} className="flex gap-4 animate-fade-in">
                            <Image src={review.user?.avatarUrl ?? FALLBACK_AVATAR} alt={review.user?.username ?? "ผู้แสดงความคิดเห็น"} width={40} height={40} className="rounded-full object-cover shrink-0" />
                            <div className="flex flex-col w-full">
                                <div className="flex items-center gap-4 flex-wrap">
                                <span className="font-bold text-gray-900">{review.isAnonymous ? "ผู้ไม่ประสงค์ออกนาม" : (review.user?.username ?? "ผู้ใช้")}</span>
                                {user && review.userId === user.id && (
                                  <span className="text-[10px] font-bold text-white bg-[#71B254] px-2 py-0.5 rounded-full">คุณ</span>
                                )}
                                {review.rating > 0 && renderStars(review.rating)}
                              </div>
                              <p className="text-gray-700 mt-1">{review.comment || "ไม่มีความคิดเห็น"}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">ยังไม่มีความคิดเห็น มารีวิวเป็นคนแรกสิ!</p>
                    )}

                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}