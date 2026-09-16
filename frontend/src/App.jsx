import React, { useState, useEffect, useMemo, useRef } from "react";


import {
  ShoppingCart, Search, User, Menu, X, Star, Plus, Minus, Trash2, RotateCcw,
  LayoutDashboard, Package, Users as UsersIcon, LogOut, ChevronLeft,
  ShoppingBag, Shirt, Gem, Droplet, Home as HomeIcon, Footprints,
  Pencil, UserRound, SprayCan, Gamepad2, Wand2,
  Mail, Lock, LogIn, UserPlus, ClipboardList,
  Clock, Truck, CheckCircle2, XCircle, DollarSign, TrendingUp, Save,
  Loader2, CreditCard, ChevronRight, Zap, ShieldCheck,
  Headphones, Facebook,
  Instagram, Sparkles,
  MessageCircle,
  Banknote,
  RefreshCcw

} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { api } from "./api.js";
import Cropper from "react-easy-crop";

/* ============================= THEME ============================= */

// const C = {
//   ink: "#0F0E0C",
//   inkSoft: "#15120D",
//   panel: "#1B160F",
//   panel2: "#211B12",
//   gold: "#C9A227",
//   goldLight: "#E8C765",
//   goldDim: "rgba(201,162,39,.14)",
//   ivory: "#FAF6EE",
//   ivoryDim: "#CBC0A8",
//   taupe: "#93866C",
//   line: "rgba(232,199,102,.16)",
//   danger: "#C2542F",
//   success: "#5B8C5A",
// };
const C = {
  // Main backgrounds
  ink: "#F0F8FF",          // Alice Blue
  inkSoft: "#EAF4FB",

  // Panels / Cards
  panel: "#FFFFFF",
  panel2: "#F5FAFE",

  // Brand accent
  gold: "#4A90B8",
  goldLight: "#6AAED0",
  goldDim: "rgba(74,144,184,.12)",

  // Text
  ivory: "#1F2933",
  ivoryDim: "#526575",
  taupe: "#718596",

  // Borders
  line: "rgba(74,144,184,.18)",

  // Status
  danger: "#D9534F",
  success: "#4F8A5B",
};


const display = {
  fontFamily: "'Amiri', 'Times New Roman', serif"
};

const body = {
  fontFamily: "'Tajawal','Segoe UI',Tahoma,Arial,sans-serif"
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("ar-EG") + " ج.م";

const CAT_META = {
  "العناية بالبشرة": {
    icon: Sparkles,
    grad:
      "radial-gradient(circle at 30% 20%, rgba(232,199,102,.22), transparent 55%), linear-gradient(160deg,#2A2013,#15110B)"
  },

  "إكسسوارات": {
    icon: Gem,
    grad:
      "radial-gradient(circle at 30% 20%, rgba(120,200,190,.16), transparent 55%), linear-gradient(160deg,#152420,#0F1714)"
  },

  "مستحضرات تجميل": {
    icon: Wand2,
    grad:
      "radial-gradient(circle at 30% 20%, rgba(224,140,150,.18), transparent 55%), linear-gradient(160deg,#2A171B,#150F10)"
  },

  "شنط": {
    icon: ShoppingBag,
    grad:
      "radial-gradient(circle at 30% 20%, rgba(180,190,110,.16), transparent 55%), linear-gradient(160deg,#212412,#12140B)"
  },

  "طرح": {
    icon: Sparkles,
    grad:
      "radial-gradient(circle at 30% 20%, rgba(120,150,200,.16), transparent 55%), linear-gradient(160deg,#151B27,#0D1116)"
  },

  "رجالي": {
    icon: UserRound,
    grad:
      "radial-gradient(circle at 30% 20%, rgba(120,150,200,.16), transparent 55%), linear-gradient(160deg,#151B27,#0D1116)"
  },

  "العاب": {
    icon: Gamepad2,
    grad:
      "radial-gradient(circle at 30% 20%, rgba(180,130,220,.18), transparent 55%), linear-gradient(160deg,#21172A,#120E16)"
  },

  "البرفانات والعطور": {
    icon: SprayCan,
    grad:
      "radial-gradient(circle at 30% 20%, rgba(232,199,102,.20), transparent 55%), linear-gradient(160deg,#261B24,#120E12)"
  },

  "منتجات اخري": {
    icon: Package,
    grad:
      "radial-gradient(circle at 30% 20%, rgba(170,170,170,.15), transparent 55%), linear-gradient(160deg,#202020,#111111)"
  }
};
const CATS = Object.keys(CAT_META);
const FALLBACK_ICON = ShoppingBag;

const catIcon = (cat) =>
  CAT_META[cat] ? CAT_META[cat].icon : FALLBACK_ICON;

const catGrad = (cat) =>
  CAT_META[cat]
    ? CAT_META[cat].grad
    : "linear-gradient(160deg,#221D14,#141009)";

const salesChartData = [
  { day: "السبت", sales: 3200 },
  { day: "الأحد", sales: 4100 },
  { day: "الاثنين", sales: 2800 },
  { day: "الثلاثاء", sales: 5200 },
  { day: "الأربعاء", sales: 4600 },
  { day: "الخميس", sales: 6100 },
  { day: "الجمعة", sales: 7300 },
];

const ORDER_STATUSES = [
  "بانتظار الدفع",
  "قيد المعالجة",
  "تم الشحن",
  "تم التسليم",
  "ملغي"
];

const statusStyle = (s) => ({
  "بانتظار الدفع": {
    color: "#C98A27",
    Icon: CreditCard
  },
  "قيد المعالجة": {
    color: C.gold,
    Icon: Clock
  },
  "تم الشحن": {
    color: "#7FA8D9",
    Icon: Truck
  },
  "تم التسليم": {
    color: C.success,
    Icon: CheckCircle2
  },
  "ملغي": {
    color: C.danger,
    Icon: XCircle
  }
}[s] || {
  color: C.taupe,
  Icon: Clock
});

/* ============================= CART STORAGE ============================= */

const loadUserCart = async (user) => {
  if (!user?.id) return [];

  try {
    const data = await api.get("/cart");

    return data.cart?.items?.map((item) => ({
      ...item.product,
      qty: item.qty,
    })) || [];
  } catch (error) {
    console.error("Failed to load cart:", error);
    return [];
  }
};

/* ============================= SMALL UI PARTS ============================= */

function Stars({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={13}
          style={{
            fill: i < rating ? C.gold : "transparent",
            stroke: C.gold,
            opacity: i < rating ? 1 : 0.35
          }}
        />
      ))}

      <span
        style={{
          color: C.taupe,
          fontSize: ".72rem",
          marginRight: 4
        }}
      >
        ({rating}.0)
      </span>
    </div>
  );
}

function Btn({
  children,
  onClick,
  variant = "gold",
  size = "md",
  full,
  type = "button",
  disabled,
  icon: Icon,
  loading
}) {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontWeight: 700,
    borderRadius: 999,
    transition: "all .2s ease",
    border: "1px solid transparent",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    width: full ? "100%" : "auto"
  };

  const sizes = {
    sm: {
      padding: "9px 18px",
      fontSize: ".8rem"
    },
    md: {
      padding: "13px 26px",
      fontSize: ".9rem"
    }
  };

  const variants = {
    gold: {
      background: C.gold,
      color: C.ink
    },
    outline: {
      background: "transparent",
      color: C.ivory,
      borderColor: C.gold
    },
    ghost: {
      background: "transparent",
      color: C.ivoryDim,
      borderColor: C.line
    },
    danger: {
      background: "transparent",
      color: C.danger,
      borderColor: C.danger
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...base,
        ...sizes[size],
        ...variants[variant]
      }}
      onMouseEnter={(e) => {
        if (variant === "gold")
          e.currentTarget.style.background = C.goldLight;

        if (variant === "outline")
          e.currentTarget.style.background = C.goldDim;
      }}
      onMouseLeave={(e) => {
        if (variant === "gold")
          e.currentTarget.style.background = C.gold;

        if (variant === "outline")
          e.currentTarget.style.background = "transparent";
      }}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        Icon && <Icon size={16} />
      )}

      {children}
    </button>
  );
}

function Input({ label, icon: Icon, ...props }) {
  return (
    <label
      className="flex flex-col gap-2"
      style={{
        fontSize: ".85rem",
        color: C.ivoryDim
      }}
    >
      {label}

      <div
        className="flex items-center gap-2"
        style={{
          background: C.ink,
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          padding: "12px 14px"
        }}
      >
        {Icon && (
          <Icon
            size={16}
            style={{
              color: C.taupe,
              flexShrink: 0
            }}
          />
        )}

        <input
          {...props}
          style={{
            background: "transparent",
            border: 0,
            outline: 0,
            color: C.ivory,
            width: "100%",
            fontFamily: "inherit",
            fontSize: ".92rem"
          }}
        />
      </div>
    </label>
  );
}

function Toast({ message }) {
  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 26,
        left: "50%",
        transform: "translateX(-50%)",
        background: C.gold,
        color: C.ink,
        padding: "14px 26px",
        borderRadius: 999,
        fontWeight: 700,
        fontSize: ".88rem",
        zIndex: 200,
        boxShadow: "0 14px 30px rgba(0,0,0,.4)",
        maxWidth: "90vw",
        textAlign: "center"
      }}
    >
      {message}
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <div
      className="flex items-center gap-3"
      style={{
        color: C.gold,
        fontWeight: 600,
        fontSize: ".8rem",
        marginBottom: 12
      }}
    >
      <span
        style={{
          width: 22,
          height: 1,
          background: C.gold
        }}
      />

      {children}
    </div>
  );
}

/* ============================= HEADER ============================= */
function Header({
  view,
  setView,
  cartCount,
  onOpenCart,
  currentUser,
  onLogout,
  setMobileOpen,
  search,
  setSearch,
  catFilter,
  setCatFilter,
  previousCategory,
  setPreviousCategory,
  setProductsPage
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".user-menu-wrapper")) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);



  const nav = [
    {
      key: "home",
      label: "الرئيسية"
    },
    {
      key: "shop",
      label: "المنتجات"
    }
  ];

  // const handleHistorySearch = (term) => {
  //   setSearch(term);
  //   setView("shop");
  //   setSearchFocused(false);
  //   setMobileSearchOpen(false);

  //   window.history.pushState({}, "", "/shop");

  //   window.scrollTo({
  //     top: 0,
  //     behavior: "smooth"
  //   });
  // };

  const handleSearchSubmit = () => {
    if (!search.trim()) return;

    // onAddSearch(search);
    setView("shop");
    setSearchFocused(false);
    setMobileSearchOpen(false);

    window.history.pushState({}, "", "/shop");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${C.line}`
      }}
    >
      {/* Main Header */}
      <div
        className="flex items-center justify-between"
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 24px",
          height: 76
        }}
      >
        {/* Mobile Menu */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          style={{
            background: "transparent",
            border: 0,
            color: C.ivory,
            cursor: "pointer",
            padding: 8
          }}
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <button
          onClick={() => {
            setSearch("");
            setView("home");
            setMobileSearchOpen(false);
            window.history.pushState({}, "", "/");
          }}
          style={{
            background: "transparent",
            border: 0,
            cursor: "pointer",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5
          }}
        >
          <span
            style={{
              ...display,
              fontSize: "1.4rem",
              lineHeight: 1,
              color: C.ivory
            }}
          >
            <b style={{ color: C.gold }}>Nour</b> Store
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center gap-8"
          style={{
            fontSize: ".95rem",
            fontWeight: 500
          }}
        >
          {nav.map((n) => (
            <button
              key={n.key}
              onClick={() => {
                if (n.key === "home") {
                  setSearch("");
                  setView("home");
                  window.history.pushState({}, "", "/");
                }

                if (n.key === "shop") {
                  setSearch("");
                  setView("shop");

                  window.history.pushState({}, "", "/shop");

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                  });
                }
              }}
              style={{
                background: "none",
                border: 0,
                cursor: "pointer",
                color:
                  view === n.key
                    ? C.ivory
                    : C.ivoryDim,
                paddingBottom: 4,
                borderBottom:
                  view === n.key
                    ? `1px solid ${C.gold}`
                    : "1px solid transparent"
              }}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* Desktop Search */}
        <div
          className="hidden md:flex items-center gap-2"
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 999,
            padding: "8px 16px",
            background: C.panel,
            width: 220,
            position: "relative"
          }}
        >
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
            style={{
              background: "transparent",
              border: 0,
              padding: 0,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              color: C.taupe
            }}
          >
            <Search size={15} />
          </button>

          <input
            value={search}
            onChange={(e) => {
              const value = e.target.value;

              if (value.trim() && !search.trim()) {
                setPreviousCategory(catFilter);
                setCatFilter("الكل");
                setProductsPage(1);
              }

              if (!value.trim() && search.trim()) {
                setCatFilter(previousCategory);
                setProductsPage(1);
              }

              setSearch(value);
            }}
            onFocus={() => {
              setSearchFocused(true);
            }}
            onBlur={() => {
              setSearchFocused(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchSubmit();
              }
            }}
            placeholder="ابحثي عن منتج..."
            style={{
              background: "transparent",
              border: 0,
              outline: 0,
              color: C.ivory,
              width: "100%",
              fontFamily: "inherit",
              fontSize: ".85rem"
            }}
          />

          {/* {searchFocused &&
            searchHistory.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: 8,
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 12,
                  padding: 8,
                  boxShadow:
                    "0 15px 30px rgba(0,0,0,.35)",
                  zIndex: 100
                }}
              > */}
          {/* {searchHistory.map((term) => (
                  <button
                    key={term}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleHistorySearch(term);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "right",
                      background: "transparent",
                      border: 0,
                      color: C.ivory,
                      padding: "9px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: "inherit"
                    }}
                  >
                    <Search
                      size={13}
                      style={{ marginLeft: 6 }}
                    />
                    {term}
                  </button>
                ))} */}
          {/* 
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onClearSearchHistory();
                    setSearchFocused(false);
                  }}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "8px 10px",
                    background: "transparent",
                    border: 0,
                    borderTop: `1px solid ${C.line}`,
                    color: C.taupe,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: ".8rem"
                  }}
                >
                  مسح سجل البحث
                </button>
              </div>
            )} */}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 relative">

          {/* Mobile Search Button */}
          <button
            className="mobile-search-button"
            onClick={() => {
              setMobileSearchOpen((v) => !v);
              setTimeout(() => {
                setSearchFocused(true);
              }, 0);
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "transparent",
              border: `1px solid ${C.line}`,
              color: C.ivory,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            {mobileSearchOpen ? (
              <X size={18} />
            ) : (
              <Search size={18} />
            )}
          </button>

          {/* User */}
          <div className="relative user-menu-wrapper">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "transparent",
                border: `1px solid ${C.line}`,
                color: C.ivory,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <User size={18} />
            </button>

            {menuOpen && (
              <div
                onMouseLeave={() => setMenuOpen(false)}
                style={{
                  position: "absolute",
                  top: 48,
                  left: 0,
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 10,
                  minWidth: 190,
                  padding: 8,
                  boxShadow:
                    "0 20px 40px rgba(0,0,0,.4)",
                  zIndex: 200
                }}
              >
                {currentUser ? (
                  <>
                    <div
                      style={{
                        padding: "8px 12px",
                        fontSize: ".8rem",
                        color: C.taupe
                      }}
                    >
                      مرحبًا، {currentUser.name}
                    </div>

                    <MenuLink
                      onClick={() => {
                        setView("account");
                        window.history.pushState(
                          {},
                          "",
                          "/account"
                        );
                        setMenuOpen(false);
                      }}
                    >
                      حسابي
                    </MenuLink>

                    {currentUser.role === "admin" && (
                      <MenuLink
                        onClick={() => {
                          setView("admin");
                          window.history.pushState(
                            {},
                            "",
                            "/admin"
                          );
                          setMenuOpen(false);
                        }}
                      >
                        لوحة التحكم
                      </MenuLink>
                    )}

                    <MenuLink
                      danger
                      onClick={() => {
                        onLogout();
                        setMenuOpen(false);
                      }}
                    >
                      تسجيل الخروج
                    </MenuLink>
                  </>
                ) : (
                  <>
                    <MenuLink
                      onClick={() => {
                        setView("login");
                        window.history.pushState(
                          {},
                          "",
                          "/login"
                        );
                        setMenuOpen(false);
                      }}
                    >
                      تسجيل الدخول
                    </MenuLink>

                    <MenuLink
                      onClick={() => {
                        setView("register");
                        window.history.pushState(
                          {},
                          "",
                          "/register"
                        );
                        setMenuOpen(false);
                      }}
                    >
                      إنشاء حساب
                    </MenuLink>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <button
            onClick={onOpenCart}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "transparent",
              border: `1px solid ${C.line}`,
              color: C.ivory,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              cursor: "pointer"
            }}
          >
            <ShoppingCart size={18} />

            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -4,
                  left: -4,
                  background: C.gold,
                  color: C.ink,
                  fontSize: ".65rem",
                  fontWeight: 800,
                  minWidth: 17,
                  height: 17,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search */}
      {mobileSearchOpen && (
        <div
          className="md:hidden"
          style={{
            padding: "0 16px 12px",
            position: "relative"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              padding: "9px 14px",
              background: C.panel,
              position: "relative"
            }}
          >
            <button
              type="button"
              onClick={handleSearchSubmit}
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                color: C.taupe
              }}
            >
              <Search size={16} />
            </button>

            <input
              autoFocus
              value={search}
              onChange={(e) => {
                const value = e.target.value;

                if (value.trim() && !search.trim()) {
                  setPreviousCategory(catFilter);
                  setCatFilter("الكل");
                  setProductsPage(1);
                }

                if (!value.trim() && search.trim()) {
                  setCatFilter(previousCategory);
                  setProductsPage(1);
                }

                setSearch(value);
                setView("shop");
              }}
              onFocus={() => {
                setSearchFocused(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              placeholder="ابحثي عن منتج..."
              style={{
                background: "transparent",
                border: 0,
                outline: 0,
                color: C.ivory,
                width: "100%",
                fontFamily: "inherit",
                fontSize: ".85rem"
              }}
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  background: "transparent",
                  border: 0,
                  color: C.taupe,
                  cursor: "pointer",
                  display: "flex"
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Mobile Search History
          {searchFocused &&
            searchHistory.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 12,
                  padding: 8,
                  boxShadow:
                    "0 15px 30px rgba(0,0,0,.35)",
                  position: "relative",
                  zIndex: 100
                }}
              >
                {searchHistory.map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      handleHistorySearch(term);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "right",
                      background: "transparent",
                      border: 0,
                      color: C.ivory,
                      padding: "10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: "inherit"
                    }}
                  >
                    <Search
                      size={13}
                      style={{ marginLeft: 6 }}
                    />
                    {term}
                  </button>
                ))}

                <button
                  onClick={() => {
                    onClearSearchHistory();
                    setSearchFocused(false);
                  }}
                  style={{
                    width: "100%",
                    marginTop: 6,
                    padding: "8px 10px",
                    background: "transparent",
                    border: 0,
                    borderTop: `1px solid ${C.line}`,
                    color: C.taupe,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: ".8rem"
                  }}
                >
                  مسح سجل البحث
                </button>
              </div>
            )} */}
        </div>
      )}
    </header>
  );
}
function MenuLink({ children, onClick, danger, setSearch }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "right",
        background: "none",
        border: 0,
        padding: "10px 12px",
        borderRadius: 6,
        color: danger ? C.danger : C.ivory,
        fontSize: ".86rem",
        cursor: "pointer"
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = C.goldDim)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "transparent")
      }
    >
      {children}
    </button>
  );
}

function MobileNav({ open, onClose, setView, setSearch }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: C.ink,
        zIndex: 95,
        padding: 24
      }}
    >
      <div
        className="flex justify-between items-center"
        style={{
          marginBottom: 30
        }}
      >
        <span
          style={{
            ...display,
            fontSize: "1.3rem"
          }}
        >
          <b style={{ color: C.gold }}>Nour</b> Store
        </span>

        <button
          onClick={onClose}
          style={{
            background: "none",
            border: 0,
            color: C.ivory
          }}
        >
          <X size={24} />
        </button>
      </div>

      {["home", "shop", "login", "register"].map((k) => (
        <button
          key={k}
          onClick={() => {
            if (k === "home" || k === "shop") {
              setSearch("");
            }

            setView(k);

            if (k === "home") {
              window.history.pushState({}, "", "/");
            }

            if (k === "shop") {
              window.history.pushState({}, "", "/shop");
            }

            onClose();
          }}
          style={{
            display: "block",
            width: "100%",
            textAlign: "right",
            background: "none",
            border: 0,
            borderBottom: `1px solid ${C.line}`,
            padding: "16px 0",
            color: C.ivory,
            fontSize: "1.05rem",
            fontWeight: 600
          }}
        >
          {{
            home: "الرئيسية",
            shop: "المنتجات",
            login: "تسجيل الدخول",
            register: "إنشاء حساب"
          }[k]}
        </button>
      ))}
    </div>
  );
}

/* ============================= STORE PAGES ============================= */




function Hero({ setView }) {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        // minHeight:"600px",
        borderBottom: "1px solid ${C.line}",
        // backgroundImage:`
        // url("/images/nour-store.png")`,
        // backgroundSize: "contain",
        // backgroundRepeat: "no-repeat",
        // backgroundPosition: "center",

      }}
    >
      <div
        style={{
          position: "absolute",
          width: 560,
          height: 560,
          borderRadius: "50%",
          // background:
          //   "radial-gradient(circle, rgba(201,162,39,.32), rgba(201,162,39,0) 70%)",
          filter: "blur(10px)",
          top: -140,
          right: -100,
          zIndex: 0,
        }}
      />

      <div
        className="grid md:grid-cols-2 items-center gap-10"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1240,
          margin: "0 auto",
          padding: "70px 24px",
                  

        }}
      >
        <div>
          <Eyebrow>اختياراتك تبدأ من هنا</Eyebrow>
          <h1
            style={{
              ...display,
              fontSize: "clamp(2.1rem,4.4vw,3.6rem)",
              lineHeight: 1.5,
              color: C.ivory
            }}
          >
            كل اللي <span style={{ color: C.gold }}>بتحبيه  </span>

            في مكان واحد
          </h1>

          <p
            style={{
              color: C.ivoryDim,
              maxWidth: 460,
              margin: "20px 0 32px",
              
            }}
          >
            تشكيلة مختارة بعناية من الأزياء - الإكسسوارات  - مستحضرات التجميل  -  منتجات العناية بالبشرة
            -  مستلزمات المنزل — جودة توثقين بها، وأسعار تُنصفك.
          </p>

          <div className="flex gap-3 flex-wrap">
            <Btn onClick={() => setView("shop")}>
              تسوّقي المجموعة
            </Btn>

            {/* <Btn
              variant="outline"
              onClick={() => setView("shop")}
            >
              اكتشفي العروض
            </Btn> */}
          </div>
        </div>



      </div>
    </section>
  );
}

function ProductCard({ p, onAdd, onOpen }) {
  const [hover, setHover] = useState(false);
  const Icon = catIcon(p.cat);

  return (
    <div
      onClick={() => onOpen(p.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.panel,
        border: `1px solid ${hover
          ? "rgba(232,199,102,.4)"
          : C.line
          }`,
        borderRadius: 4,
        overflow: "hidden",
        transition:
          "transform .25s ease, border-color .25s ease",
        transform: hover ? "translateY(-5px)" : "none",
        position: "relative",
        cursor: "pointer"
      }}

    >
      <div
        style={{
          aspectRatio: "4/5",
          background: catGrad(p.cat),
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {p.old && (
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: C.danger,
              color: C.ivory,
              fontSize: ".68rem",
              fontWeight: 800,
              padding: "5px 12px",
              borderRadius: 20
            }}
          >
            خصم
          </span>
        )}

        {p.stock <= 8 && !p.old && (
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: C.ivory,
              color: C.ink,
              fontSize: ".68rem",
              fontWeight: 800,
              padding: "5px 12px",
              borderRadius: 20
            }}
          >
            كمية محدودة
          </span>
        )}

        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block"
            }}
          />
        ) : (
          <Icon
            size={54}
            style={{
              color: C.gold,
              opacity: 0.9
            }}
          />
        )}


      </div>

      <div
        style={{
          padding: "16px 16px 18px"
        }}
      >
        <div
          style={{
            color: C.taupe,
            fontSize: ".7rem",
            fontWeight: 600
          }}
        >
          {p.cat}
        </div>

        <div
          style={{
            fontWeight: 700,
            fontSize: ".95rem",
            margin: "6px 0 8px",
            color: C.ivory
          }}
        >
          {p.name}
        </div>

        <Stars rating={p.rating} />

        <div
          className="flex items-baseline gap-2"
          style={{
            marginTop: 8
          }}
        >
          <span
            style={{
              fontWeight: 800,
              color: C.goldLight
            }}
          >
            {fmt(p.price)}
          </span>

          {p.old && (
            <span
              style={{
                color: C.taupe,
                textDecoration: "line-through",
                fontSize: ".8rem"
              }}
            >
              {fmt(p.old)}
            </span>
          )}


        </div>
        <div
          className="product-card-add"
          style={{
            marginTop: 12,
            opacity: hover ? 1 : 0,
            transform: hover
              ? "translateY(0)"
              : "translateY(10px)",
            transition: ".2s"
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(p);
            }}
            style={{
              width: "100%",
              background: C.ink,
              color: C.ivory,
              border: `1px solid ${C.gold}`,
              padding: 9,
              borderRadius: 4,
              fontWeight: 700,
              fontSize: ".7rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              cursor: "pointer"
            }}
          >
            <ShoppingCart size={14} />
            أضيفي للسلة
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductDetails({ product, onAdd, onBack }) {
  //    useEffect(() => {
  //   document.title = `${product.name} | Nour Store`;

  //   const description =
  //     product.description ||
  //     `اشتري ${product.name} من Nour Store بأفضل سعر.`;

  //   let metaDescription = document.querySelector(
  //     'meta[name="description"]'
  //   );

  //   if (!metaDescription) {
  //     metaDescription = document.createElement("meta");
  //     metaDescription.setAttribute("name", "description");
  //     document.head.appendChild(metaDescription);
  //   }

  //   metaDescription.setAttribute("content", description);
  // }, [product]);
  const [qty, setQty] = useState(1);
  const Icon = catIcon(product.cat);

  return (
    <section
      style={{
        padding: "60px 0"
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px"
        }}
      >
        {/* زر الرجوع */}
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: `1px solid ${C.line}`,
            color: C.ivoryDim,
            padding: "9px 16px",
            borderRadius: 6,
            cursor: "pointer",
            marginBottom: 30,
            fontFamily: "inherit"
          }}
        >
          ← العودة للمنتجات
        </button>

        <div
          className="product-details-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: 40,
            alignItems: "start"
          }}
        >
          {/* صورة المنتج */}
          <div
            style={{
              aspectRatio: "4 /4 ",
              background: catGrad(product.cat),
              borderRadius: 8,
              overflow: "hidden",
              border: `1px solid ${C.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block"
                }}
              />
            ) : (
              <Icon
                size={80}
                style={{
                  color: C.gold,
                  opacity: 0.9
                }}
              />
            )}
          </div>

          {/* بيانات المنتج */}
          <div
            style={{
              paddingTop: 10
            }}
          >
            <div
              style={{
                color: C.taupe,
                fontSize: ".8rem",
                fontWeight: 600,
                marginBottom: 10
              }}
            >
              {product.cat}
            </div>

            <h1
              style={{
                ...display,
                color: C.ivory,
                fontSize: "clamp(1.7rem, 3vw, 2.5rem)",
                margin: "0 0 14px"
              }}
            >
              {product.name}
            </h1>

            <Stars rating={product.rating} />

            {/* السعر */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 12,
                marginTop: 20
              }}
            >
              <span
                style={{
                  color: C.goldLight,
                  fontSize: "1.4rem",
                  fontWeight: 800
                }}
              >
                {fmt(product.price)}
              </span>

              {product.old && (
                <span
                  style={{
                    color: C.taupe,
                    textDecoration: "line-through",
                    fontSize: ".9rem"
                  }}
                >
                  {fmt(product.old)}
                </span>
              )}
            </div>

            {/* الوصف */}
            {product.description && (
              <div
                style={{
                  marginTop: 25,
                  paddingTop: 20,
                  borderTop: `1px solid ${C.line}`
                }}
              >
                <div
                  style={{
                    color: C.ivory,
                    fontWeight: 700,
                    marginBottom: 10
                  }}
                >
                  وصف المنتج
                </div>

                <p
                  style={{
                    color: C.ivoryDim,
                    lineHeight: 1.9,
                    fontSize: ".9rem",
                    margin: 0,
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {product.description}
                </p>
              </div>
            )}

            {/* المخزون */}
            <div
              style={{
                marginTop: 22,
                color:
                  product.stock <= 8
                    ? C.danger
                    : C.ivoryDim,
                fontSize: ".85rem"
              }}
            >
              {product.stock > 0
                ? `متوفر في المخزون: ${product.stock}`
                : "غير متوفر حاليًا"}
            </div>

            {/* إضافة للسلة */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 22
              }}
            >
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 6,
                  border: `1px solid ${C.line}`,
                  background: C.panel,
                  color: C.ivory,
                  cursor: qty > 1 ? "pointer" : "not-allowed",
                  fontSize: "1.2rem",
                  fontFamily: "inherit"
                }}
              >
                −
              </button>

              <div
                style={{
                  minWidth: 45,
                  textAlign: "center",
                  color: C.ivory,
                  fontWeight: 800,
                  fontSize: "1rem"
                }}
              >
                {qty}
              </div>

              <button
                type="button"
                onClick={() =>
                  setQty((q) => Math.min(product.stock, q + 1))
                }
                disabled={qty >= product.stock}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 6,
                  border: `1px solid ${C.line}`,
                  background: C.panel,
                  color: C.ivory,
                  cursor:
                    qty < product.stock
                      ? "pointer"
                      : "not-allowed",
                  fontSize: "1.2rem",
                  fontFamily: "inherit"
                }}
              >
                +
              </button>
            </div>
            <button
              disabled={product.stock <= 0}
              onClick={() => onAdd(product, qty)}
              style={{
                width: "100%",
                marginTop: 25,
                padding: 14,
                borderRadius: 6,
                border: `1px solid ${C.gold}`,
                background:
                  product.stock > 0
                    ? C.gold
                    : C.line,
                color:
                  product.stock > 0
                    ? C.ink
                    : C.taupe,
                fontWeight: 800,
                fontSize: ".9rem",
                cursor:
                  product.stock > 0
                    ? "pointer"
                    : "not-allowed",
                fontFamily: "inherit"
              }}
            >
              {product.stock > 0
                ? "أضيفي للسلة"
                : "غير متوفر"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


function FeaturedProductsSlider({
  products,
  loading,
  onAdd,
  openProduct,
  openShop
}) {
  const sliderRef = useRef(null);

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;

    sliderRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth"
    });
  };

  if (loading) {
    return (
      <section
        style={{
          padding: "60px 0"
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: C.taupe
          }}
        >
          جارِ تحميل المنتجات...
        </div>
      </section>
    );
  }

  const featured = products
    .filter((p) => p.isActive === true)
    .slice(0, 8);
  return (
    <section
      style={{
        padding: "60px 0"
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 24px"
        }}
      >
        <Eyebrow>مختارات المتجر</Eyebrow>

        <h2
          style={{
            ...display,
            fontSize: "clamp(1.6rem,2.6vw,2.2rem)",
            marginBottom: 30,
            color: C.ivory
          }}
        >
          أحدث الاضافات
        </h2>

        <div
          style={{
            position: "relative"
          }}
        >
          {/* زر اليمين */}
          <button
            onClick={() => scrollSlider("right")}
            style={{
              position: "absolute",
              right: -18,
              top: "45%",
              transform: "translateY(-50%)",
              zIndex: 5,
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: `1px solid ${C.gold}`,
              background: C.ink,
              color: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0,0,0,.3)"
            }}
          >
            <ChevronRight size={20} />
          </button>

          {/* زر الشمال */}
          <button
            onClick={() => scrollSlider("left")}
            style={{
              position: "absolute",
              left: -18,
              top: "45%",
              transform: "translateY(-50%)",
              zIndex: 5,
              width: 42,
              height: 42,
              borderRadius: "50%",
              border: `1px solid ${C.gold}`,
              background: C.ink,
              color: C.gold,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0,0,0,.3)"
            }}
          >
            <ChevronLeft size={20} />
          </button>

          {/* السلايدر */}
          <div
            ref={sliderRef}
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 20,
              overflowX: "auto",
              overflowY: "hidden",
              paddingBottom: 15,
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              width: "100%"
            }}
          >
            {featured.map((p) => (
              <div
                key={p.id}
                style={{
                  flex: "0 0 280px",
                  width: "280px",
                  scrollSnapAlign: "start"
                }}
              >
                <ProductCard
                  p={p}
                  onAdd={onAdd}
                  onOpen={(id) => {
                    openProduct(id, "home");
                  }}
                />
              </div>
            ))}

            {/* كارت كل المنتجات */}
            <div
              style={{
                flex: "0 0 280px",
                width: "280px",
                minHeight: 420,
                border: `1px solid ${C.gold}`,
                borderRadius: 4,
                background: C.panel,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                scrollSnapAlign: "start"
              }}
            >
              <div
                style={{
                  color: C.gold,
                  fontSize: "1.2rem",
                  fontWeight: 800
                }}
              >
                اكتشفي كل منتجاتنا
              </div>

              <button
                onClick={openShop}
                style={{
                  background: C.gold,
                  color: C.ink,
                  border: 0,
                  padding: "12px 24px",
                  borderRadius: 4,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                عرض جميع المنتجات →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
function Shop({
  products,
  loading,
  onAdd,
  catFilter,
  setCatFilter,
  search,
  setSearch,
  setView,
  openProduct,
  productsPage,
  setProductsPage,
  productsPagination
}) {
  const filtered = products.filter((p) => p.isActive === true); return (
    <section
      style={{
        padding: "60px 0"
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 24px"
        }}
      >
        <Eyebrow>مختارات المتجر</Eyebrow>

        <h2
          style={{
            ...display,
            fontSize: "clamp(1.6rem,2.6vw,2.2rem)",
            marginBottom: 30,
            color: C.ivory
          }}
        >
          منتجات المتجر
        </h2>
        {/* Categories */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 10,
            marginBottom: 35,
            flexWrap: "wrap"
          }}
        >
          {["الكل", ...CATS].map((c) => {
            const active = catFilter === c;

            return (
              <button
                key={c}
                onClick={() => {
                  setSearch("");
                  setCatFilter(c);
                  setProductsPage(1);
                }}
                style={{
                  width: 150,
                  height: 44,
                  padding: 0,
                  borderRadius: 999,
                  border: `1px solid ${active ? C.gold : C.line
                    }`,
                  background: active
                    ? C.gold
                    : "rgba(255,255,255,0.025)",
                  color: active
                    ? C.ink
                    : C.ivory,
                  fontSize: ".86rem",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  transition: "all .25s ease",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: active
                    ? "0 5px 18px rgba(0,0,0,.18)"
                    : "none"
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.borderColor = C.gold;
                    e.currentTarget.style.color = C.gold;
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.borderColor = C.line;
                    e.currentTarget.style.color = C.ivory;
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.025)";
                  }
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Products */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              color: C.taupe,
              padding: "60px 0"
            }}
          >
            جارِ تحميل المنتجات...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: C.taupe,
              padding: "60px 0"
            }}
          >
            لا توجد منتجات مطابقة لبحثك.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  onAdd={onAdd}
                  onOpen={(id) => {
                    openProduct(
                      id,
                      "shop",
                      catFilter
                    );
                  }}
                />
              ))}
            </div>

            {/* Pagination */}
            {/* Pagination */}
            {productsPagination?.totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 45,
                  flexWrap: "wrap"
                }}
              >
                {/* السابق */}
                <button
                  disabled={!productsPagination.hasPreviousPage}
                  onClick={() =>
                    setProductsPage((prev) => prev - 1)
                  }
                  style={{
                    padding: "9px 16px",
                    borderRadius: 999,
                    border: `1px solid ${C.line}`,
                    background: "transparent",
                    color: C.ivory,
                    cursor: productsPagination.hasPreviousPage
                      ? "pointer"
                      : "not-allowed",
                    opacity: productsPagination.hasPreviousPage
                      ? 1
                      : 0.5
                  }}
                >
                  السابق
                </button>

                {/* أرقام الصفحات */}
                {Array.from(
                  {
                    length: productsPagination.totalPages
                  },
                  (_, index) => index + 1
                ).map((page) => (
                  <button
                    key={page}
                    onClick={() => setProductsPage(page)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: `1px solid ${productsPage === page
                        ? C.gold
                        : C.line
                        }`,
                      background:
                        productsPage === page
                          ? C.gold
                          : "transparent",
                      color:
                        productsPage === page
                          ? C.ink
                          : C.ivoryDim,
                      cursor: "pointer",
                      fontWeight: 600
                    }}
                  >
                    {page}
                  </button>
                ))}

                {/* التالي */}
                <button
                  disabled={!productsPagination.hasNextPage}
                  onClick={() =>
                    setProductsPage((prev) => prev + 1)
                  }
                  style={{
                    padding: "9px 16px",
                    borderRadius: 999,
                    border: `1px solid ${C.line}`,
                    background: "transparent",
                    color: C.ivory,
                    cursor: productsPagination.hasNextPage
                      ? "pointer"
                      : "not-allowed",
                    opacity: productsPagination.hasNextPage
                      ? 1
                      : 0.5
                  }}
                >
                  التالي
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function CategoryStrip({ setView, setCatFilter }) {
  return (
    <section
      style={{
        background: C.inkSoft,
        borderBottom: `1px solid ${C.line}`,
        padding: "50px 0"
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 24px"
        }}
      >
        <Eyebrow>تسوّقي حسب الفئة</Eyebrow>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {CATS.map((cat) => {
            const Icon = catIcon(cat);

            return (
              <button
                key={cat}
                onClick={() => {
                  setCatFilter(cat);
                  setView("shop");

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                  });
                }}
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 4,
                  padding: "26px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: ".2s"
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = C.gold)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = C.line)
                }
              >
                <Icon
                  size={28}
                  style={{
                    color: C.gold,
                    margin: "0 auto 12px"
                  }}
                />

                <span
                  style={{
                    fontWeight: 700,
                    fontSize: ".9rem",
                    color: C.ivory,
                    display: "block"
                  }}
                >
                  {cat}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhyNourStore() {
  const features = [
    {
      icon: Truck,
      title: "توصيل لكل مصر",
      text: "نوصل طلبك لحد باب بيتك في جميع المحافظات."
    },
    {
      icon: Zap,
      title: "شحن سريع",
      text: "نهتم بسرعة تجهيز وشحن طلبك في أقرب وقت."
    },
    {
      icon: ShieldCheck,
      title: "جودة نثق بها",
      text: "منتجات مختارة بعناية علشان نقدم لك تجربة أفضل."
    },
    {
      icon: Headphones,
      title: "خدمة عملاء",
      text: "فريقنا موجود لمساعدتك والإجابة عن استفساراتك."
    },
    {
      icon: Banknote,
      title: "دفع عند الاستلام",
      text: "اطلبي بسهولة وادفعي عند استلام طلبك."
    },
    {
      icon: RefreshCcw,
      title: "استبدال واسترجاع",
      text: "سياسة مرنة تساعدك تطلبي وأنتِ مطمئنة."
    }
  ];

  return (
    <section
      style={{
        background: C.ink,
        borderTop: `1px solid ${C.line}`,
        borderBottom: `1px solid ${C.line}`,
        padding: "70px 0"
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 24px"
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 42
          }}
        >
          <Eyebrow>لماذا نور ستور؟</Eyebrow>

          <h2
            style={{
              ...display,
              fontSize: "clamp(1.7rem, 3vw, 2.4rem)",
              color: C.ivory,
              margin: "10px 0 12px"
            }}
          >
            تجربة تسوّق تستحق ثقتك
          </h2>

          <p
            style={{
              color: C.ivoryDim,
              maxWidth: 600,
              margin: "0 auto",
              lineHeight: 1.8,
              fontSize: ".9rem"
            }}
          >
            من اختيار المنتج لحد ما يوصل لباب بيتك، نهتم بكل تفصيلة
            علشان تكون تجربتك مع Nour Store أسهل وأفضل.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 6,
                  padding: "28px 20px",
                  textAlign: "center",
                  transition: "all .25s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.gold;
                  e.currentTarget.style.transform =
                    "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.line;
                  e.currentTarget.style.transform =
                    "translateY(0)";
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    margin: "0 auto 16px",
                    borderRadius: "50%",
                    border: `1px solid ${C.gold}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Icon
                    size={23}
                    style={{
                      color: C.gold
                    }}
                  />
                </div>

                <h3
                  style={{
                    color: C.ivory,
                    fontSize: "1rem",
                    fontWeight: 800,
                    margin: "0 0 9px"
                  }}
                >
                  {feature.title}
                </h3>

                <p
                  style={{
                    color: C.ivoryDim,
                    fontSize: ".78rem",
                    lineHeight: 1.8,
                    margin: 0
                  }}
                >
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BackToTop() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        })
      }
      aria-label="Back to top"
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        width: 42,
        height: 42,
        borderRadius: "50%",
        border: `1px solid ${C.line}`,
        background: C.panel,
        color: C.ivory,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 1000,
        boxShadow: "0 8px 25px rgba(0,0,0,.18)",
        transition: "all .2s ease"
      }}
    >
      ↑
    </button>
  );
}

function FloatingWhatsApp() {
  return (
    <a
      href="https://wa.me/201148476391"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      style={{
        position: "fixed",
        right: 16,
        bottom: 70,
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: "#25D366",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        zIndex: 1000,
        boxShadow: "0 8px 25px rgba(0,0,0,.18)",
        transition: "all .2s ease"
      }}
    >
      <MessageCircle size={20} />
    </a>
  );
}
function Footer() {
  const socialLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: "https://www.facebook.com/share/1DQD8t2SxG/"
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://www.instagram.com/nour.store.beauty?stkn=cm9tNHNjdnBqODIx"
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: "https://wa.me/201148476391"
    }
  ];

  return (
    <footer
      style={{
        background: C.inkSoft,
        borderTop: `1px solid ${C.line}`,
        padding: "55px 24px 30px",
        textAlign: "center"
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto"
        }}
      >
        <div
          style={{
            ...display,
            color: C.ivory,
            fontSize: "1.4rem",
            fontWeight: 800,
            marginBottom: 10
          }}
        >
          Nour Store
        </div>

        <p
          style={{
            color: C.taupe,
            fontSize: ".82rem",
            margin: "0 auto 24px"
          }}
        >
          كل ما تحتاجينه... في مكان واحد.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            marginBottom: 35
          }}
        >
          {socialLinks.map((social) => {
            const Icon = social.icon;

            return (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: `1px solid ${C.line}`,
                  background: C.panel,
                  color: C.ivoryDim,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  transition: "all .2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = C.gold;
                  e.currentTarget.style.borderColor = C.gold;
                  e.currentTarget.style.transform =
                    "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.ivoryDim;
                  e.currentTarget.style.borderColor = C.line;
                  e.currentTarget.style.transform =
                    "translateY(0)";
                }}
              >
                <Icon size={19} />
              </a>
            );
          })}
        </div>

        <div
          style={{
            borderTop: `1px solid ${C.line}`,
            paddingTop: 20,
            color: C.taupe,
            fontSize: ".75rem"
          }}
        >
          © 2026 Nour Store. جميع الحقوق محفوظة.
        </div>
        <div
          style={{
            paddingTop: 20,
            color: C.taupe,
            fontSize: ".75rem"
          }}
        >
          <div>
            Designed & Developed by{" "}
            <a
              href="https://wa.me/201152357201"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: C.gold,
                textDecoration: "none",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Mohamed Ataa
            </a>
          </div>

        </div>

      </div>

    </footer>
  );
}
/* ============================= CART DRAWER ============================= */


function CartDrawer({
  open,
  onClose,
  cart,
  onInc,
  onDec,
  onRemove,
  onCheckout,
  checkingOut,
  currentUser,
  guestInfo,
  setGuestInfo,
}) {
  const subtotal = cart.reduce(
    (s, i) => s + i.price * i.qty,
    0
  );

  const [method, setMethod] = useState("cod");
  const inputStyle = {
    width: "100%",
    padding: "13px 15px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    background: "#fff",
    color: "#000",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.55)",
          zIndex: 90,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: ".3s"
        }}
      />

      <aside
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          width: 400,
          maxWidth: "92vw",
          background: C.inkSoft,
          borderRight: `1px solid ${C.line}`,
          zIndex: 91,
          transform: open
            ? "translateX(0)"
            : "translateX(-100%)",
          transition:
            "transform .35s cubic-bezier(.4,0,.2,1)",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div
          className="flex justify-between items-center"
          style={{
            padding: "22px 24px",
            borderBottom: `1px solid ${C.line}`
          }}
        >
          <h3
            style={{
              ...display,
              fontSize: "1.15rem",
              color: C.ivory
            }}
          >
            سلة المشتريات
          </h3>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: 0,
              color: C.ivory
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 18
          }}
        >
          {cart.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: C.taupe,
                padding: "60px 20px"
              }}
            >
              <ShoppingCart
                size={44}
                style={{
                  margin: "0 auto 16px",
                  opacity: 0.5
                }}
              />

              السلة فاضية دلوقتي.
              <br />
              استكشفي المنتجات وابدئي التسوق.
            </div>
          ) : (
            cart.map((i) => {
              const Icon = catIcon(i.cat);

              return (
                <div
                  key={i.id}
                  className="flex gap-3"
                  style={{
                    paddingBottom: 18,
                    borderBottom: `1px solid ${C.line}`
                  }}
                >

                  <div
                    style={{
                      width: 66,
                      height: 82,
                      borderRadius: 4,
                      flexShrink: 0,
                      background: catGrad(i.cat),
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {i.image ? (
                      <img
                        src={i.image}
                        alt={i.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                      />
                    ) : (
                      <Icon
                        size={26}
                        style={{
                          color: C.gold
                        }}
                      />
                    )}
                  </div>

                  <div
                    style={{
                      flex: 1
                    }}
                  >
                    <b
                      style={{
                        fontSize: ".88rem",
                        color: C.ivory
                      }}
                    >
                      {i.name}
                    </b>

                    <div
                      style={{
                        color: C.goldLight,
                        fontSize: ".85rem",
                        margin: "4px 0 8px"
                      }}
                    >
                      {fmt(i.price)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onDec(i.id)
                        }
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          border: `1px solid ${C.line}`,
                          background: "transparent",
                          color: C.ivory,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Minus size={12} />
                      </button>

                      <span
                        style={{
                          fontSize: ".85rem"
                        }}
                      >
                        {i.qty}
                      </span>

                      <button
                        onClick={() =>
                          onInc(i.id)
                        }
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          border: `1px solid ${C.line}`,
                          background: "transparent",
                          color: C.ivory,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Plus size={12} />
                      </button>

                      <button
                        onClick={() =>
                          onRemove(i.id)
                        }
                        style={{
                          marginRight: "auto",
                          background: "none",
                          border: 0,
                          color: C.taupe
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {cart.length > 0 && (
          <div
            style={{
              padding: "0 24px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10
            }}
          >
            <div
              style={{
                color: C.taupe,
                fontSize: ".78rem",
                marginBottom: 2
              }}
            >
              بيانات التوصيل
            </div>
            <input
              type="text"
              placeholder="الاسم بالكامل"
              value={currentUser ? currentUser.name : guestInfo.customerName}
              onChange={(e) => {
                const value = e.target.value.replace(/[^ء-يa-zA-Z\s]/g, "");

                setGuestInfo({
                  ...guestInfo,
                  customerName: value
                });
              }}
              disabled={!!currentUser}
              maxLength={80}
              style={inputStyle}
            />

            <input
              type="tel"
              placeholder="رقم الموبايل"
              value={guestInfo.phone}
              maxLength={11}
              inputMode="numeric"
              pattern="01[0125][0-9]{8}"
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");

                setGuestInfo({
                  ...guestInfo,
                  phone: value
                });
              }}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="العنوان بالتفصيل"
              value={guestInfo.address}
              maxLength={300}
              onChange={(e) => {
                const value = e.target.value.slice(0, 300);

                setGuestInfo({
                  ...guestInfo,
                  address: value
                });
              }}
              style={inputStyle}
            />

            {/* <input
              type="text"
              placeholder="المدينة"
              value={guestInfo.city}
              maxLength={100}
              onChange={(e) => {
                const value = e.target.value.slice(0, 100);

                setGuestInfo({
                  ...guestInfo,
                  city: value
                });
              }}
              style={inputStyle}
            /> */}
            {/* 
            <input
              type="text"
              placeholder="المحافظة"
              value={guestInfo.governorate}
              maxLength={100}
              onChange={(e) => {
                const value = e.target.value.slice(0, 100);

                setGuestInfo({
                  ...guestInfo,
                  governorate: value
                });
              }}
              style={inputStyle}
            /> */}
            {/* 
           <textarea
  placeholder="ملاحظات إضافية (اختياري)"
  value={guestInfo.notes}
  maxLength={500}
  onChange={(e) => {
    const value = e.target.value.slice(0, 500);

    setGuestInfo({
      ...guestInfo,
      notes: value
    });
  }}
  style={{
    ...inputStyle,
    minHeight: "90px",
    resize: "vertical"
  }}
/> */}
          </div>
        )}


        {cart.length > 0 && (
          <div
            style={{
              padding: "0 24px 18px"
            }}
          >
            <div
              style={{
                color: C.taupe,
                fontSize: ".78rem",
                marginBottom: 10
              }}
            >
              طريقة الدفع
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMethod("cod")}
                style={{
                  flex: 1,
                  padding: "12px 10px",
                  borderRadius: 8,
                  border: `1px solid ${method === "cod"
                    ? C.gold
                    : C.line
                    }`,
                  background:
                    method === "cod"
                      ? C.goldDim
                      : "transparent",
                  color:
                    method === "cod"
                      ? C.gold
                      : C.ivoryDim,
                  fontSize: ".82rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                الدفع عند الاستلام
              </button>

              <button
                onClick={() => setMethod("card")}
                style={{
                  flex: 1,
                  padding: "12px 10px",
                  borderRadius: 8,
                  border: `1px solid ${method === "card"
                    ? C.gold
                    : C.line
                    }`,
                  background:
                    method === "card"
                      ? C.goldDim
                      : "transparent",
                  color:
                    method === "card"
                      ? C.gold
                      : C.ivoryDim,
                  fontSize: ".82rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                بطاقة ائتمان / خصم
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            padding: "22px 24px",
            borderTop: `1px solid ${C.line}`
          }}
        >
          <div
            className="flex justify-between"
            style={{
              fontWeight: 700,
              fontSize: "1.05rem",
              marginBottom: 16,
              color: C.ivory
            }}
          >
            <span>الإجمالي</span>
            <span>{fmt(subtotal)}</span>
          </div>

          <Btn
            full
            onClick={() => onCheckout(method)}
            loading={checkingOut}
          >
            إتمام الشراء
          </Btn>
        </div>
      </aside>
    </>
  );
}

/* ============================= AUTH PAGES ============================= */

function AuthShell({
  title,
  subtitle,
  children
}) {
  return (
    <section
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: 36
        }}
      >
        <div
          className="flex items-center gap-2"
          style={{
            marginBottom: 6
          }}
        >
          <Sparkles
            size={18}
            style={{
              color: C.gold
            }}
          />

          <span
            style={{
              ...display,
              fontSize: "1.2rem",
              color: C.ivory
            }}
          >
            <b style={{ color: C.gold }}>Nour</b> Store
          </span>
        </div>

        <h2
          style={{
            ...display,
            fontSize: "1.5rem",
            color: C.ivory,
            marginTop: 14
          }}
        >
          {title}
        </h2>

        <p
          style={{
            color: C.taupe,
            fontSize: ".85rem",
            marginTop: 6,
            marginBottom: 26
          }}
        >
          {subtitle}
        </p>

        {children}
      </div>
    </section>
  );
}

function LoginPage({
  onLogin,
  setView
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await onLogin(
        email.trim(),
        password
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="تسجيل الدخول"
      subtitle="أهلًا بعودتك، سجّلي الدخول لمتابعة طلباتك."
    >
      <form
        onSubmit={submit}
        className="flex flex-col gap-4"
      >
        <Input
          label="البريد الإلكتروني"
          icon={Mail}
          type="email"
          required
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="example@nour.com"
        />

        <Input
          label="كلمة المرور"
          icon={Lock}
          type="password"
          required
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          placeholder="••••••••"
        />

        {error && (
          <div
            style={{
              color: C.danger,
              fontSize: ".82rem"
            }}
          >
            {error}
          </div>
        )}

        <Btn
          type="submit"
          full
          icon={LogIn}
          loading={loading}
        >
          دخول
        </Btn>
      </form>

      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          fontSize: ".85rem",
          color: C.ivoryDim
        }}
      >
        مالكيش حساب؟{" "}
        <button
          onClick={() =>
            setView("register")
          }
          style={{
            background: "none",
            border: 0,
            color: C.gold,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          سجّلي دلوقتي
        </button>
      </div>
    </AuthShell>
  );
}

function RegisterPage({
  onRegister,
  setView
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");

    if (form.password !== form.confirm) {
      setError(
        "كلمتا المرور غير متطابقتين."
      );
      return;
    }

    if (form.password.length < 6) {
      setError(
        "كلمة المرور يجب أن تكون 6 أحرف على الأقل."
      );
      return;
    }

    setLoading(true);

    try {
      await onRegister(
        form.name.trim(),
        form.email.trim(),
        form.password
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="إنشاء حساب جديد"
      subtitle="انضمي لعائلة نور واستمتعي بعروض حصرية."
    >
      <form
        onSubmit={submit}
        className="flex flex-col gap-4"
      >
        <Input
          label="الاسم الكامل"
          icon={User}
          required
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value
            })
          }
          placeholder="اسمك"
        />

        <Input
          label="البريد الإلكتروني"
          icon={Mail}
          type="email"
          required
          value={form.email}
          onChange={(e) =>
            setForm({
              ...form,
              email: e.target.value
            })
          }
          placeholder="example@nour.com"
        />

        <Input
          label="كلمة المرور"
          icon={Lock}
          type="password"
          required
          value={form.password}
          onChange={(e) =>
            setForm({
              ...form,
              password: e.target.value
            })
          }
          placeholder="••••••••"
        />

        <Input
          label="تأكيد كلمة المرور"
          icon={Lock}
          type="password"
          required
          value={form.confirm}
          onChange={(e) =>
            setForm({
              ...form,
              confirm: e.target.value
            })
          }
          placeholder="••••••••"
        />

        {error && (
          <div
            style={{
              color: C.danger,
              fontSize: ".82rem"
            }}
          >
            {error}
          </div>
        )}

        <Btn
          type="submit"
          full
          icon={UserPlus}
          loading={loading}
        >
          إنشاء الحساب
        </Btn>
      </form>

      <div
        style={{
          marginTop: 20,
          textAlign: "center",
          fontSize: ".85rem",
          color: C.ivoryDim
        }}
      >
        عندك حساب بالفعل؟{" "}
        <button
          onClick={() =>
            setView("login")
          }
          style={{
            background: "none",
            border: 0,
            color: C.gold,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          سجّلي الدخول
        </button>
      </div>
    </AuthShell>
  );
}

/* ============================= DASHBOARD SHELL ============================= */



function DashSidebar({
  tabs,
  active,
  setActive
}) {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 900
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  return (
    <div
      className="admin-sidebar"
      style={{
        width: isMobile ? "100%" : 230,
        flexShrink: 0,
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        padding: isMobile ? 8 : 16,
        height: "fit-content",

        display: "flex",
        flexDirection: isMobile ? "row" : "column",

        gap: isMobile ? 6 : 0,

        overflowX: isMobile ? "auto" : "visible",
        overflowY: "hidden",

        boxSizing: "border-box",

        WebkitOverflowScrolling: "touch"
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setActive(t.key)}
          style={{
            width: isMobile ? "auto" : "100%",
            flexShrink: 0,

            display: "flex",
            alignItems: "center",
            gap: 10,

            textAlign: "right",

            padding: isMobile
              ? "10px 14px"
              : "12px 14px",

            borderRadius: 6,

            background:
              active === t.key
                ? C.goldDim
                : "transparent",

            color:
              active === t.key
                ? C.gold
                : C.ivoryDim,

            border: 0,

            fontSize: isMobile
              ? ".8rem"
              : ".88rem",

            fontWeight: 600,

            cursor: "pointer",

            marginBottom: isMobile
              ? 0
              : 4,

            whiteSpace: "nowrap"
          }}
        >
          <t.icon size={16} />
          {t.label}
        </button>
      ))}
    </div>
  );
}



function KpiCard({
  icon: Icon,
  label,
  value
}) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        padding: 20
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          marginBottom: 14
        }}
      >
        <span
          style={{
            color: C.taupe,
            fontSize: ".8rem"
          }}
        >
          {label}
        </span>

        <Icon
          size={18}
          style={{
            color: C.gold
          }}
        />
      </div>

      <div
        style={{
          ...display,
          fontSize: "1.5rem",
          color: C.ivory
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* ============================= ACCOUNT DASHBOARD ============================= */

function AccountDashboard({
  user,
  orders,
  ordersLoading,
  onUpdateProfile
}) {
  const [tab, setTab] = useState("overview");

  const totalSpent = orders.reduce(
    (s, o) => s + o.total,
    0
  );

  const [profile, setProfile] = useState({
    name: user.name,
    email: user.email
  });

  const [saving, setSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      await onUpdateProfile(profile);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    {
      key: "overview",
      label: "نظرة عامة",
      icon: LayoutDashboard
    },
    {
      key: "orders",
      label: "طلباتي",
      icon: ClipboardList
    },
    {
      key: "profile",
      label: "الملف الشخصي",
      icon: User
    }
  ];

  return (
    <section className="account-dashboard">
      <div
        className="account-dashboard-layout"
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "25px 24px",
          display: "flex",
          gap: 24,
          alignItems: "flex-start"
        }}
      >
        {/* Sidebar */}
        <DashSidebar
          tabs={tabs}
          active={tab}
          setActive={setTab}
        />

        {/* Content */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%"
          }}
        >
          <h2
            style={{
              ...display,
              fontSize: "1.6rem",
              color: C.ivory,
              marginBottom: 24
            }}
          >
            مرحبًا، {user.name}
          </h2>

          {/* ================= OVERVIEW ================= */}
          {tab === "overview" && (
            <>
              <div
                className="grid grid-cols-2 gap-4 account-kpis"
                style={{
                  marginBottom: 30
                }}
              >
                <KpiCard
                  icon={ClipboardList}
                  label="إجمالي الطلبات"
                  value={orders.length}
                />

                <KpiCard
                  icon={DollarSign}
                  label="إجمالي الإنفاق"
                  value={fmt(totalSpent)}
                />
              </div>

              <h3
                style={{
                  ...display,
                  fontSize: "1.1rem",
                  color: C.ivory,
                  marginBottom: 14
                }}
              >
                أحدث الطلبات
              </h3>

              <OrdersTable
                orders={orders.slice(0, 5)}
                loading={ordersLoading}
              />
            </>
          )}

          {/* ================= ORDERS ================= */}
          {tab === "orders" && (
            <OrdersTable
              orders={orders}
              loading={ordersLoading}
            />
          )}

          {/* ================= PROFILE ================= */}
          {tab === "profile" && (
            <form
              onSubmit={saveProfile}
              className="flex flex-col gap-4 account-profile-form"
              style={{
                maxWidth: 400,
                width: "100%"
              }}
            >
              <Input
                label="الاسم الكامل"
                icon={User}
                value={profile.name}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    name: e.target.value
                  })
                }
              />

              <Input
                label="البريد الإلكتروني"
                icon={Mail}
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    email: e.target.value
                  })
                }
                disabled
              />

              <Btn
                type="submit"
                icon={Save}
                loading={saving}
              >
                حفظ التعديلات
              </Btn>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}




function OrdersTable({
  orders,
  loading
}) {
  if (loading) {
    return (
      <div
        style={{
          color: C.taupe,
          padding: "30px 0"
        }}
      >
        جارِ تحميل الطلبات...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        style={{
          color: C.taupe,
          padding: "30px 0"
        }}
      >
        لا توجد طلبات حتى الآن.
      </div>
    );
  }

  return (
    <div
      className="account-orders-table"
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        overflowX: "auto",
        overflowY: "hidden",
        width: "100%",
        WebkitOverflowScrolling: "touch"
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: 1000,
          borderCollapse: "collapse",
          fontSize: ".85rem"
        }}
      >
        <thead>
          <tr
            style={{
              background: C.panel2,
              color: C.taupe,
              textAlign: "right",
              whiteSpace: "nowrap"
            }}
          >
            <th style={{ padding: 14 }}>
              رقم الطلب
            </th>

            <th style={{ padding: 14 }}>
              التاريخ
            </th>

            <th style={{ padding: 14 }}>
              العميل
            </th>

            <th style={{ padding: 14 }}>
              الموبايل
            </th>

            <th style={{ padding: 14 }}>
              العنوان
            </th>

            <th style={{ padding: 14 }}>
              عدد المنتجات
            </th>

            <th style={{ padding: 14 }}>
              الإجمالي
            </th>

            <th style={{ padding: 14 }}>
              الحالة
            </th>
          </tr>
        </thead>

        <tbody>
          {orders.map((o) => {
            const {
              color,
              Icon
            } = statusStyle(o.status);

            return (
              <tr
                key={o.id}
                style={{
                  borderTop: `1px solid ${C.line}`,
                  color: C.ivory
                }}
              >
                <td style={{ padding: 14 }}>
                  #{o.id}
                </td>

                <td
                  style={{
                    padding: 14,
                    color: C.ivoryDim,
                    whiteSpace: "nowrap"
                  }}
                >
                  {o.date}
                </td>

                <td style={{ padding: 14 }}>
                  {o.customerName || "—"}
                </td>

                <td style={{ padding: 14 }}>
                  {o.phone || "—"}
                </td>

                <td
                  style={{
                    padding: 14,
                    maxWidth: 220
                  }}
                >
                  {o.address || "—"}

                  {o.city && (
                    <div
                      style={{
                        color: C.taupe,
                        fontSize: ".75rem",
                        marginTop: 4
                      }}
                    >
                      {o.city}

                      {o.governorate
                        ? ` - ${o.governorate}`
                        : ""}
                    </div>
                  )}
                </td>

                <td style={{ padding: 14 }}>
                  {o.items?.reduce(
                    (sum, item) =>
                      sum + item.qty,
                    0
                  ) || 0}
                </td>

                <td
                  style={{
                    padding: 14,
                    color: C.goldLight,
                    fontWeight: 700,
                    whiteSpace: "nowrap"
                  }}
                >
                  {fmt(o.total)}
                </td>

                <td style={{ padding: 14 }}>
                  <span
                    className="flex items-center gap-1"
                    style={{
                      color,
                      whiteSpace: "nowrap"
                    }}
                  >
                    <Icon size={14} />
                    {o.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


/* ============================= ADMIN DASHBOARD ============================= */

const createCroppedImage = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(
              new Error("تعذر تجهيز الصورة")
            );
            return;
          }

          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    };

    image.onerror = reject;
    image.src = imageSrc;
  });
};

function ProductFormModal({
  product,
  onSave,
  onClose
}) {
  const [form, setForm] =
    useState(
      product || {
        name: "",
        cat: CATS[0],
        price: "",
        old: "",
        stock: "",
        rating: 5,
        description: "",
        image: null
      }
    );

  const [imagePreview, setImagePreview] =
    useState(product?.image || "");
  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [showCrop, setShowCrop] =
    useState(false);

  const [crop, setCrop] =
    useState({ x: 0, y: 0 });

  const [zoom, setZoom] =
    useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState(null);

  const onCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("cat", form.cat);
      formData.append("price", Number(form.price));
      formData.append(
        "old",
        form.old ? Number(form.old) : ""
      );
      formData.append("stock", Number(form.stock));
      formData.append("rating", Number(form.rating));
      formData.append(
        "description",
        form.description || ""
      );

      if (form.image instanceof File) {
        formData.append("image", form.image);
      }


      console.log("IMAGE:", form.image);
      console.log("FORM DATA IMAGE:", formData.get("image"));
      await onSave(formData);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        overflowY: "auto"
      }}
    >
      <form
        onSubmit={submit}
        style={{
          background: C.panel,
          border: `1px solid ${C.line}`,
          borderRadius: 10,
          padding: 30,
          width: "100%",
          maxWidth: 420,
          maxHeight: "90vh",
          overflowY: "auto"
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex justify-between items-center">
          <h3
            style={{
              ...display,
              fontSize: "1.2rem",
              color: C.ivory
            }}
          >
            {product
              ? "تعديل المنتج"
              : "إضافة منتج جديد"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: 0,
              color: C.taupe
            }}
          >
            <X size={20} />
          </button>
        </div>

        <Input
          label="اسم المنتج"
          required
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value
            })
          }
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
        >
          <label
            style={{
              fontSize: ".85rem",
              color: C.ivoryDim
            }}
          >
            صورة المنتج
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (!file) return;

              setForm({
                ...form,
                image: file
              });

              setImagePreview(
                URL.createObjectURL(file)
              );

              setCrop({ x: 0, y: 0 });
              setZoom(1);
              setShowCrop(true);
            }}
            style={{
              color: C.ivory,
              fontSize: ".8rem"
            }}
          />
          {showCrop && imagePreview && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 200,
                background: "rgba(0,0,0,.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 500,
                  background: C.panel,
                  borderRadius: 12,
                  padding: 20,
                  border: `1px solid ${C.line}`
                }}
              >
                <div
                  style={{
                    color: C.ivory,
                    fontWeight: 700,
                    marginBottom: 15,
                    textAlign: "center"
                  }}
                >
                  قص صورة المنتج
                </div>

                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: 400,
                    background: C.ink,
                    borderRadius: 8,
                    overflow: "hidden"
                  }}
                >
                  <Cropper
                    image={imagePreview}
                    crop={crop}
                    zoom={zoom}
                    aspect={4 / 5}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>

                <div
                  style={{
                    marginTop: 15,
                    color: C.ivoryDim,
                    fontSize: ".8rem"
                  }}
                >
                  التكبير
                </div>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) =>
                    setZoom(Number(e.target.value))
                  }
                  style={{
                    width: "100%",
                    marginTop: 8
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    marginTop: 20
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowCrop(false);
                    }}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${C.line}`,
                      background: "transparent",
                      color: C.ivory,
                      cursor: "pointer"
                    }}
                  >
                    إلغاء
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (!croppedAreaPixels) return;

                        const croppedBlob =
                          await createCroppedImage(
                            imagePreview,
                            croppedAreaPixels
                          );

                        const croppedFile = new File(
                          [croppedBlob],
                          "product-image.jpg",
                          {
                            type: "image/jpeg"
                          }
                        );

                        const croppedUrl =
                          URL.createObjectURL(croppedBlob);

                        setForm({
                          ...form,
                          image: croppedFile
                        });

                        setImagePreview(croppedUrl);
                        setShowCrop(false);
                      } catch (err) {
                        setError(
                          "حدث خطأ أثناء قص الصورة"
                        );
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      border: `1px solid ${C.gold}`,
                      background: C.gold,
                      color: C.ink,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    اعتماد الصورة
                  </button>
                </div>
              </div>
            </div>
          )}
          {imagePreview && (
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 5",
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${C.line}`,
                background: C.ink
              }}
            >
              <img
                src={imagePreview}
                alt="معاينة المنتج"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center"
                }}
              />

              <button
                type="button"
                onClick={() => {
                  setForm({
                    ...form,
                    image: null
                  });
                  setImagePreview("");
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: 0,
                  background: "rgba(0,0,0,.7)",
                  color: C.ivory,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <textarea
          placeholder="اكتبي وصف المنتج..."
          value={form.description || ""}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value
            })
          }
          rows={6}
          style={{
            width: "100%",
            minHeight: 140,
            background: C.ink,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: "12px 14px",
            color: C.ivory,
            fontFamily: "inherit",
            fontSize: ".85rem",
            resize: "vertical",
            boxSizing: "border-box"
          }}
        />

        <label
          className="flex flex-col gap-2"
          style={{
            fontSize: ".85rem",
            color: C.ivoryDim
          }}
        >
          الفئة

          <select
            value={form.cat}
            onChange={(e) =>
              setForm({
                ...form,
                cat: e.target.value
              })
            }
            style={{
              background: C.ink,
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              padding: "12px 14px",
              color: C.ivory,
              fontFamily: "inherit"
            }}
          >
            {CATS.map((c) => (
              <option
                key={c}
                value={c}
              >
                {c}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="السعر"
            type="number"
            required
            value={form.price}
            onChange={(e) =>
              setForm({
                ...form,
                price: e.target.value
              })
            }
          />

          <Input
            label="السعر قبل الخصم"
            type="number"
            value={form.old || ""}
            onChange={(e) =>
              setForm({
                ...form,
                old: e.target.value
              })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="المخزون"
            type="number"
            required
            value={form.stock}
            onChange={(e) =>
              setForm({
                ...form,
                stock: e.target.value
              })
            }
          />

          <Input
            label="التقييم (1-5)"
            type="number"
            min="1"
            max="5"
            required
            value={form.rating}
            onChange={(e) =>
              setForm({
                ...form,
                rating: e.target.value
              })
            }
          />
        </div>

        {error && (
          <div
            style={{
              color: C.danger,
              fontSize: ".82rem"
            }}
          >
            {error}
          </div>
        )}

        <Btn
          type="submit"
          full
          icon={Save}
          loading={saving}
        >
          حفظ المنتج
        </Btn>
      </form>
    </div>
  );
}



function AdminDashboard({
  products,
  orders,
  ordersLoading,
  customers,
  onSaveProduct,
  onDeleteProduct,
  reactivateProduct,
  onNotify,
  onUpdateOrderStatus,
  onDeleteOrder,
  onOpenDeleteOrder
}) {


  const [tab, setTab] = useState(() => {
    const path = window.location.pathname;

    if (path === "/admin/products") return "products";
    if (path === "/admin/orders") return "orders";
    if (path === "/admin/customers") return "customers";

    return "overview";
  });

  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const saveProduct = async (formData) => {
    await onSaveProduct(formData, editing?.id);

    setShowForm(false);
    setEditing(null);
  };

  const totalSales = orders.reduce(
    (s, o) => s + o.total,
    0
  );

  const tabs = [
    {
      key: "overview",
      label: "نظرة عامة",
      icon: LayoutDashboard
    },
    {
      key: "products",
      label: "المنتجات",
      icon: Package
    },
    {
      key: "orders",
      label: "الطلبات",
      icon: ClipboardList
    },
    {
      key: "customers",
      label: "العملاء",
      icon: UsersIcon
    }
  ];

  const handleTabChange = (nextTab) => {
    setTab(nextTab);

    const routes = {
      overview: "/admin",
      products: "/admin/products",
      orders: "/admin/orders",
      customers: "/admin/customers"
    };

    window.history.pushState(
      {},
      "",
      routes[nextTab]
    );
  };

  return (
    <section
      style={{
        padding: "50px 0"
      }}
    >
      <div
        className="admin-dashboard-layout"
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          flexDirection:
            window.innerWidth <= 900
              ? "column"
              : "row",
          gap: window.innerWidth <= 900
            ? 16
            : 24,
          alignItems: "stretch"
        }}
      >

        {/* Sidebar */}
        <DashSidebar
          tabs={tabs}
          active={tab}
          setActive={handleTabChange}
        />

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            width: "100%"
          }}
        >
          <h2
            style={{
              ...display,
              fontSize: "1.6rem",
              color: C.ivory,
              marginBottom: 24
            }}
          >
            لوحة تحكم المتجر
          </h2>

          {/* ================= OVERVIEW ================= */}
          {tab === "overview" && (
            <>
              <div
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                style={{
                  marginBottom: 30
                }}
              >
                <KpiCard
                  icon={DollarSign}
                  label="إجمالي المبيعات"
                  value={fmt(totalSales)}
                />

                <KpiCard
                  icon={ClipboardList}
                  label="عدد الطلبات"
                  value={orders.length}
                />

                <KpiCard
                  icon={UsersIcon}
                  label="عدد العملاء"
                  value={customers.length}
                />

                <KpiCard
                  icon={Package}
                  label="عدد المنتجات"
                  value={products.length}
                />
              </div>

              <div
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
                  padding: 20,
                  overflow: "hidden"
                }}
              >
                <div
                  className="flex items-center gap-2"
                  style={{
                    marginBottom: 16
                  }}
                >
                  <TrendingUp
                    size={16}
                    style={{
                      color: C.gold
                    }}
                  />

                  <span
                    style={{
                      color: C.ivory,
                      fontWeight: 700,
                      fontSize: ".92rem"
                    }}
                  >
                    نظرة عامة على المبيعات
                    (بيانات توضيحية لآخر ٧ أيام)
                  </span>
                </div>

                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <LineChart
                    data={salesChartData}
                  >
                    <CartesianGrid
                      stroke={C.line}
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="day"
                      stroke={C.taupe}
                      fontSize={12}
                    />

                    <YAxis
                      stroke={C.taupe}
                      fontSize={12}
                    />

                    <Tooltip
                      contentStyle={{
                        background: C.panel2,
                        border: `1px solid ${C.line}`,
                        borderRadius: 8,
                        color: C.ivory
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke={C.gold}
                      strokeWidth={2.5}
                      dot={{
                        fill: C.gold,
                        r: 3
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {/* ================= PRODUCTS ================= */}
          {tab === "products" && (
            <>
              <div
                className="flex justify-between items-center"
                style={{
                  marginBottom: 18
                }}
              >
                <span
                  style={{
                    color: C.taupe,
                    fontSize: ".85rem"
                  }}
                >
                  {products.length} منتج
                </span>

                <Btn
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setEditing(null);
                    setShowForm(true);
                  }}
                >
                  إضافة منتج
                </Btn>
              </div>

              <div
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 8,
                  maxHeight: 500,
                  overflow: "auto",
                  WebkitOverflowScrolling: "touch"
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: 700,
                    borderCollapse: "collapse",
                    fontSize: ".85rem"
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: C.panel2,
                        color: C.taupe,
                        textAlign: "right",
                        position: "sticky",
                        top: 0,
                        zIndex: 10
                      }}
                    >
                      <th style={{ padding: 14 }}>
                        الصورة
                      </th>
                      <th style={{ padding: 14 }}>
                        المنتج
                      </th>

                      <th style={{ padding: 14 }}>
                        الفئة
                      </th>

                      <th style={{ padding: 14 }}>
                        السعر
                      </th>

                      <th style={{ padding: 14 }}>
                        المخزون
                      </th>

                      <th style={{ padding: 14 }} />
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((p) => (
                      <tr
                        key={p.id}
                        style={{
                          borderTop: `1px solid ${C.line}`,
                          color: C.ivory
                        }}
                      >
                        <td
                          style={{
                            padding: 10
                          }}
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            style={{
                              width: 60,
                              height: 60,
                              objectFit: "cover",
                              borderRadius: 6,
                              border: `1px solid ${C.line}`,
                              display: "block"
                            }}
                          />
                        </td>
                        <td
                          style={{
                            padding: 14,
                            fontWeight: 600
                          }}
                        >
                          {p.name}
                        </td>

                        <td
                          style={{
                            padding: 14,
                            color: C.ivoryDim
                          }}
                        >
                          {p.cat}
                        </td>

                        <td
                          style={{
                            padding: 14,
                            color: C.goldLight
                          }}
                        >
                          {fmt(p.price)}
                        </td>

                        <td
                          style={{
                            padding: 14,
                            color:
                              p.stock <= 8
                                ? C.danger
                                : C.ivoryDim
                          }}
                        >
                          {p.stock}
                        </td>

                        <td
                          style={{
                            padding: 14
                          }}
                        >
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditing(p);
                                setShowForm(true);
                              }}
                              style={{
                                background: "none",
                                border: 0,
                                color: C.gold,
                                cursor: "pointer"
                              }}
                            >
                              <Pencil size={16} />
                            </button>

                            {p.isActive ? (
                              <button
                                onClick={async () => {
                                  await onDeleteProduct(p.id);

                                  onNotify(
                                    "تم حذف المنتج من الموقع بنجاح 🗑️"
                                  );
                                }}
                                style={{
                                  background: "none",
                                  border: 0,
                                  color: C.danger,
                                  cursor: "pointer"
                                }}
                                title="حذف من الموقع"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  await reactivateProduct(p.id);

                                  onNotify(
                                    "تم إعادة المنتج إلى الموقع بنجاح ✨"
                                  );
                                }}
                                style={{
                                  background: "none",
                                  border: 0,
                                  color: C.gold,
                                  cursor: "pointer"
                                }}
                                title="إعادة المنتج للموقع"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showForm && (
                <ProductFormModal
                  product={editing}
                  onSave={saveProduct}
                  onClose={() => {
                    setShowForm(false);
                    setEditing(null);
                  }}
                />
              )}
            </>
          )}

          {/* ================= ORDERS ================= */}
          {tab === "orders" && (
            <div
              style={{
                background: C.panel,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                overflow: "auto",
                maxHeight: 500,
                WebkitOverflowScrolling: "touch"
              }}
            >
              {ordersLoading ? (
                <div
                  style={{
                    padding: 30,
                    color: C.taupe
                  }}
                >
                  جارِ تحميل الطلبات...
                </div>
              ) : orders.length === 0 ? (
                <div
                  style={{
                    padding: 30,
                    color: C.taupe
                  }}
                >
                  لا توجد طلبات حتى الآن.
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    minWidth: 1100,
                    borderCollapse: "collapse",
                    fontSize: ".85rem"
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: C.panel2,
                        color: C.taupe,
                        textAlign: "right",
                        position: "sticky",
                        top: 0,
                        zIndex: 2
                      }}
                    >
                      <th style={{ padding: 14 }}>
                        رقم الطلب
                      </th>

                      <th style={{ padding: 14 }}>
                        التاريخ
                      </th>

                      <th style={{ padding: 14 }}>
                        العميل
                      </th>

                      <th style={{ padding: 14 }}>
                        الموبايل
                      </th>

                      <th style={{ padding: 14 }}>
                        العنوان
                      </th>

                      <th style={{ padding: 14 }}>
                        المنتجات
                      </th>

                      <th style={{ padding: 14 }}>
                        عدد المنتجات
                      </th>

                      <th style={{ padding: 14 }}>
                        الإجمالي
                      </th>

                      <th style={{ padding: 14 }}>
                        الحالة
                      </th>
                      <th style={{ padding: 14 }}>
                        الإجراء
                      </th>


                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        style={{
                          borderTop: `1px solid ${C.line}`,
                          color: C.ivory
                        }}
                      >
                        <td style={{ padding: 14 }}>
                          #{o.id}
                        </td>

                        <td
                          style={{
                            padding: 14,
                            color: C.ivoryDim
                          }}
                        >
                          {o.date}
                        </td>

                        <td style={{ padding: 14 }}>
                          {o.customerName || "—"}
                        </td>

                        <td style={{ padding: 14 }}>
                          {o.phone || "—"}
                        </td>

                        <td
                          style={{
                            padding: 14,
                            maxWidth: 220
                          }}
                        >
                          {o.address || "—"}

                          {o.city && (
                            <div
                              style={{
                                color: C.taupe,
                                fontSize: ".75rem",
                                marginTop: 4
                              }}
                            >
                              {o.city}

                              {o.governorate
                                ? ` - ${o.governorate}`
                                : ""}
                            </div>
                          )}
                        </td>

                        <td
                          style={{
                            padding: 14,
                            minWidth: 240
                          }}
                        >
                          {o.items?.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                marginBottom: 10
                              }}
                            >
                              <div
                                style={{
                                  width: 50,
                                  height: 62,
                                  flexShrink: 0,
                                  borderRadius: 6,
                                  overflow: "hidden",
                                  background: catGrad(
                                    item.cat
                                  ),
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: `1px solid ${C.line}`
                                }}
                              >
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      display: "block"
                                    }}
                                  />
                                ) : (
                                  <Package
                                    size={22}
                                    style={{
                                      color: C.gold,
                                      opacity: 0.8
                                    }}
                                  />
                                )}
                              </div>

                              <div>
                                <div>
                                  {item.name} × {item.qty}
                                </div>

                                <div
                                  style={{
                                    color: C.taupe,
                                    fontSize: ".75rem",
                                    marginTop: 2
                                  }}
                                >
                                  {fmt(item.price)} للقطعة
                                </div>
                              </div>
                            </div>
                          ))}
                        </td>

                        <td style={{ padding: 14 }}>
                          {o.items?.reduce(
                            (sum, item) =>
                              sum + item.qty,
                            0
                          ) || 0}
                        </td>

                        <td
                          style={{
                            padding: 14,
                            color: C.goldLight,
                            fontWeight: 700
                          }}
                        >
                          {fmt(o.total)}
                        </td>

                        <td style={{ padding: 14 }}>
                          <select
                            value={o.status}
                            onChange={(e) =>
                              onUpdateOrderStatus(
                                o.id,
                                e.target.value
                              )
                            }
                            style={{
                              background: C.ink,
                              border: `1px solid ${C.line}`,
                              borderRadius: 6,
                              padding: "6px 10px",
                              color: C.ivory,
                              fontFamily: "inherit",
                              fontSize: ".8rem"
                            }}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option
                                key={s}
                                value={s}
                              >
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: 14 }}>
                          {o.status === "تم التسليم" && (
                            <button
                              onClick={() => onOpenDeleteOrder(o.id)}
                              title="حذف الطلب"
                              style={{
                                background: "none",
                                border: 0,
                                color: C.danger,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 4
                              }}
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </td>


                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ================= CUSTOMERS ================= */}
          {tab === "customers" && (
            <div
              style={{
                background: C.panel,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                overflow: "auto",
                WebkitOverflowScrolling: "touch"
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: 600,
                  borderCollapse: "collapse",
                  fontSize: ".85rem"
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: C.panel2,
                      color: C.taupe,
                      textAlign: "right"
                    }}
                  >
                    <th style={{ padding: 14 }}>
                      الاسم
                    </th>

                    <th style={{ padding: 14 }}>
                      البريد الإلكتروني
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((u) => (
                    <tr
                      key={u.id}
                      style={{
                        borderTop: `1px solid ${C.line}`,
                        color: C.ivory
                      }}
                    >
                      <td
                        style={{
                          padding: 14,
                          fontWeight: 600
                        }}
                      >
                        {u.name}
                      </td>

                      <td
                        style={{
                          padding: 14,
                          color: C.ivoryDim
                        }}
                      >
                        {u.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


/* ============================= APP ROOT ============================= */

export default function App() {

  const [productPreviousCategory, setProductPreviousCategory] =
    useState("الكل");



  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path === "/admin" || path.startsWith("/admin/")) {
      return "admin";
    }
    if (/^\/product\/\d+$/.test(path)) {
      return "product";
    }

    if (path === "/shop") {
      return "shop";
    }

    if (path === "/login") {
      return "login";
    }

    if (path === "/register") {
      return "register";
    }

    return "home";
  });

  const [selectedProductId, setSelectedProductId] = useState(() => {
    const match = window.location.pathname.match(
      /^\/product\/(\d+)$/
    );

    return match ? Number(match[1]) : null;
  });
  useEffect(() => {
    if (view !== "product") {
      setSelectedProductId(null);
    }
  }, [view]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;

      if (/^\/product\/\d+$/.test(path)) {
        const match = path.match(/^\/product\/(\d+)$/);

        setSelectedProductId(Number(match[1]));
        setView("product");
        return;
      }

      if (path === "/shop") {
        setSelectedProductId(null);
        setView("shop");
        return;
      }

      if (path === "/login") {
        setSelectedProductId(null);
        setView("login");
        return;
      }

      if (path === "/register") {
        setSelectedProductId(null);
        setView("register");
        return;
      }

      if (path === "/admin" || path.startsWith("/admin/")) {
        setSelectedProductId(null);
        setView("admin");
        return;
      }

      setSelectedProductId(null);
      setView("home");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
  const [productPreviousView, setProductPreviousView] =
    useState("shop");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [cartOpen, setCartOpen] =
    useState(false);

  const [search, setSearch] =
    useState("");
  // const [searchHistory, setSearchHistory] =
  //   useState([]);


  const [catFilter, setCatFilter] =
    useState("الكل");
  const [previousCategory, setPreviousCategory] = useState("الكل");
  const [toast, setToast] =
    useState("");

  const [products, setProducts] = useState([]);

  const [productsPage, setProductsPage] = useState(1);

  const [productsPagination, setProductsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [productsLoading, setProductsLoading] =
    useState(true);

  const selectedProduct = products.find(
    (p) => p.id === selectedProductId
  );

  useEffect(() => {
    if (view === "product" && selectedProduct) {
      document.title = `${selectedProduct.name} | Nour Store`;
    } else {
      document.title = "Nour Store";
    }
  }, [view, selectedProduct]);

  const openProduct = (
    id,
    previousView = "shop",
    previousCategory = "الكل"
  ) => {
    setSelectedProductId(id);
    setProductPreviousView(previousView);
    setProductPreviousCategory(previousCategory);
    setView("product");

    window.history.pushState(
      { productId: id },
      "",
      `/product/${id}`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const [currentUser, setCurrentUser] =
    useState(null);

  const searchStorageKey = currentUser
    ? `nour_store_search_user_${currentUser.id}`
    : "nour_store_search_guest";

  // useEffect(() => {
  //   const saved = localStorage.getItem(searchStorageKey);

  //   if (saved) {
  //     try {
  //       setSearchHistory(JSON.parse(saved));
  //     } catch {
  //       setSearchHistory([]);
  //     }
  //   } else {
  //     setSearchHistory([]);
  //   }

  //   setSearch("");
  // }, [searchStorageKey]);
  const [authChecked, setAuthChecked] =
    useState(false);

  /*
    ============================
    IMPORTANT
    ============================

    Cart now belongs to the current user.

    Example:

    User X:
    localStorage:
    nour_store_cart_user_1

    User Y:
    localStorage:
    nour_store_cart_user_2
  */

  const [cart, setCart] =
    useState([]);

  const [checkingOut, setCheckingOut] =
    useState(false);

  const [guestInfo, setGuestInfo] = useState({
    customerName: "",
    phone: "",
    address: "",
    city: "",
    governorate: "",
    notes: "",
  });
  const [orders, setOrders] =
    useState([]);

  const [ordersLoading, setOrdersLoading] =
    useState(false);


  const [deleteOrderId, setDeleteOrderId] = useState(null);
  const [deletingOrder, setDeletingOrder] = useState(false);



  const [customers, setCustomers] =
    useState([]);

  const notify = (msg) => {
    setToast(msg);

    setTimeout(
      () => setToast(""),
      2800
    );
  };

  // const addSearchToHistory = (value) => {
  //   const cleanSearch = value.trim();

  //   if (!cleanSearch) return;

  //   setSearchHistory((prev) => {
  //     const updated = [
  //       cleanSearch,
  //       ...prev.filter((item) => item !== cleanSearch)
  //     ].slice(0, 10);

  //     localStorage.setItem(
  //       searchStorageKey,
  //       JSON.stringify(updated)
  //     );

  //     return updated;
  //   });
  // };

  // const clearSearchHistory = () => {
  //   localStorage.removeItem(searchStorageKey);
  //   setSearchHistory([]);
  // };

  /* ============================= CART PER USER ============================= */

  /*
    Whenever currentUser changes:

    - If there is a logged-in user:
        load that user's cart.

    - If there is no user:
        clear the cart.

    This prevents User Y from seeing User X's cart.
  */
  useEffect(() => {
    if (!currentUser) {
      const savedGuestCart =
        localStorage.getItem("nour_store_guest_cart");

      if (savedGuestCart) {
        try {
          setCart(JSON.parse(savedGuestCart));
        } catch {
          setCart([]);
        }
      } else {
        setCart([]);
      }

      return;
    }

    let cancelled = false;

    const fetchCart = async () => {
      try {
        const data = await api.get("/cart");

        if (cancelled) return;

        const items =
          data.cart?.items?.map((item) => ({
            ...item.product,
            qty: item.qty,
          })) || [];

        setCart(items);
      } catch (error) {
        console.error("Failed to load cart:", error);
        setCart([]);
      }
    };

    fetchCart();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);
  /* ============================= PAYMOB REDIRECT ============================= */

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    if (params.has("success")) {
      const ok =
        params.get("success") ===
        "true";

      notify(
        ok
          ? "تم الدفع بنجاح 🎉 جاري تجهيز طلبك"
          : "لم تكتمل عملية الدفع، ممكن تحاولي تاني"
      );

      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );

      setView(
        ok ? "account" : "shop"
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================= LOAD PRODUCTS ============================= */

  /* ============================= LOAD PRODUCTS ============================= */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setProductsLoading(true);

        const isAdminDashboard =
          window.location.pathname.startsWith("/admin");

        // ================= ADMIN DASHBOARD =================
        // الأدمن داشبورد يشوف كل المنتجات، حتى المخفية
        if (
          isAdminDashboard &&
          currentUser?.role === "admin"
        ) {
          const d = await api.get("/products/admin");

          setProducts(d.products);
          setProductsPagination(null);

          return;
        }

        // ================= PUBLIC WEBSITE =================
        // الموقع، حتى لو المستخدم Admin، يشوف المنتجات النشطة فقط
        // مع Pagination و Category و Search

        const params = new URLSearchParams();

        params.set("page", productsPage);
        params.set("limit", 8);

        if (
          catFilter &&
          catFilter !== "الكل" &&
          !search.trim()
        ) {
          params.set("category", catFilter);
        }

        if (search.trim()) {
          params.set("search", search.trim());
        }

        const url = `/products?${params.toString()}`;

        const d = await api.get(url);

        setProducts(d.products);
        setProductsPagination(d.pagination);

      } catch (err) {
        console.error("PRODUCTS ERROR:", err);
        notify(err.message);
      } finally {
        setProductsLoading(false);
      }
    };

    if (!authChecked) return;

    loadProducts();
  }, [
    currentUser,
    authChecked,
    productsPage,
    catFilter,
    search,
  ]);
  /* ============================= RESTORE SESSION ============================= */

  useEffect(() => {
    const token = api.getToken();

    if (!token) {
      setAuthChecked(true);
      return;
    }

    api
      .get("/auth/me")
      .then((d) => {
        setCurrentUser(d.user);
      })
      .catch(() => {
        api.setToken(null);
        setCurrentUser(null);
      })
      .finally(() =>
        setAuthChecked(true)
      );
  }, []);

  /* ============================= ROUTE GUARDS ============================= */

  useEffect(() => {
    if (!authChecked) return;

    if (
      view === "account" &&
      !currentUser
    ) {
      setView("login");

      notify(
        "سجّلي الدخول أولاً للوصول لحسابك."
      );
    }

    if (
      view === "admin" &&
      (!currentUser ||
        currentUser.role !== "admin")
    ) {
      setView(
        currentUser
          ? "home"
          : "login"
      );

      if (currentUser) {
        notify(
          "هذه الصفحة مخصصة لمالكة المتجر فقط."
        );
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    view,
    currentUser,
    authChecked
  ]);

  /* ============================= DASHBOARD DATA ============================= */

  useEffect(() => {
    if (
      view === "account" &&
      currentUser
    ) {
      setOrdersLoading(true);

      api
        .get("/orders/mine")
        .then((d) =>
          setOrders(d.orders)
        )
        .catch((e) =>
          notify(e.message)
        )
        .finally(() =>
          setOrdersLoading(false)
        );
    }

    if (
      view === "admin" &&
      currentUser?.role === "admin"
    ) {
      setOrdersLoading(true);

      Promise.all([
        api.get("/orders/all"),
        api.get("/users")
      ])
        .then(([o, u]) => {

          setOrders(o.orders);
          setCustomers(u.users);
        })
        .catch((e) =>
          notify(e.message)
        )
        .finally(() =>
          setOrdersLoading(false)
        );
    }
  }, [
    view,
    currentUser
  ]);

  /* ============================= CART FUNCTIONS ============================= */


  const addToCart = async (p, qty = 1) => {
    if (!currentUser) {
      setCart((prev) => {
        const exists = prev.find(
          (i) => i.id === p.id
        );

        const updated = exists
          ? prev.map((i) =>
            i.id === p.id
              ? {
                ...i,
                qty: Math.min(
                  i.qty + qty,
                  p.stock
                ),
              }
              : i
          )
          : [
            ...prev,
            {
              ...p,
              qty: Math.min(qty, p.stock),
            },
          ];

        localStorage.setItem(
          "nour_store_guest_cart",
          JSON.stringify(updated)
        );

        return updated;
      });

      notify(
        `تمت إضافة ${qty} من "${p.name}" إلى السلة`
      );

      return;
    }

    try {
      const data = await api.post(
        "/cart/items",
        {
          productId: p.id,
          qty,
        }
      );

      const item = data.item;

      setCart((prev) => {
        const exists = prev.find(
          (i) => i.id === item.product.id
        );

        if (exists) {
          return prev.map((i) =>
            i.id === item.product.id
              ? {
                ...i,
                qty: item.qty,
              }
              : i
          );
        }

        return [
          ...prev,
          {
            ...item.product,
            qty: item.qty,
          },
        ];
      });

      notify(
        `تمت إضافة ${qty} من "${p.name}" إلى السلة`
      );
    } catch (err) {
      console.error(
        "ADD TO CART ERROR:",
        err
      );

      notify(err.message);
    }
  };

  const incItem = async (id) => {
    const item = cart.find(
      (i) => i.id === id
    );

    if (!item) return;

    // Guest cart
    if (!currentUser) {
      setCart((prev) => {
        const updated = prev.map((i) =>
          i.id === id
            ? {
              ...i,
              qty: i.qty + 1,
            }
            : i
        );

        localStorage.setItem(
          "nour_store_guest_cart",
          JSON.stringify(updated)
        );

        return updated;
      });

      return;
    }

    // Logged-in user cart
    try {
      const data = await api.put(
        `/cart/items/${id}`,
        {
          qty: item.qty + 1,
        }
      );

      setCart((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
              ...i,
              qty: data.item.qty,
            }
            : i
        )
      );
    } catch (err) {
      console.error(
        "INCREASE CART ERROR:",
        err
      );

      notify(err.message);
    }
  };

  const decItem = async (id) => {
    const item = cart.find(
      (i) => i.id === id
    );

    if (!item) return;

    // Guest cart
    if (!currentUser) {
      if (item.qty === 1) {
        setCart((prev) => {
          const updated = prev.filter(
            (i) => i.id !== id
          );

          localStorage.setItem(
            "nour_store_guest_cart",
            JSON.stringify(updated)
          );

          return updated;
        });

        return;
      }

      setCart((prev) => {
        const updated = prev.map((i) =>
          i.id === id
            ? {
              ...i,
              qty: i.qty - 1,
            }
            : i
        );

        localStorage.setItem(
          "nour_store_guest_cart",
          JSON.stringify(updated)
        );

        return updated;
      });

      return;
    }
    // Logged-in user cart
    try {
      if (item.qty === 1) {
        await api.del(
          `/cart/items/${id}`
        );

        setCart((prev) =>
          prev.filter(
            (i) => i.id !== id
          )
        );

        return;
      }

      const data = await api.put(
        `/cart/items/${id}`,
        {
          qty: item.qty - 1,
        }
      );

      setCart((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
              ...i,
              qty: data.item.qty,
            }
            : i
        )
      );
    } catch (err) {
      console.error(
        "DECREASE CART ERROR:",
        err
      );

      notify(err.message);
    }
  };

  const removeItem = async (id) => {
    // Guest cart
    if (!currentUser) {
      setCart((prev) => {
        const updated = prev.filter(
          (i) => i.id !== id
        );

        localStorage.setItem(
          "nour_store_guest_cart",
          JSON.stringify(updated)
        );

        return updated;
      });

      return;
    }

    // Logged-in user cart
    try {
      await api.del(
        `/cart/items/${id}`
      );

      setCart((prev) =>
        prev.filter(
          (i) => i.id !== id
        )
      );
    } catch (err) {
      console.error(
        "REMOVE CART ITEM ERROR:",
        err
      );

      notify(err.message);
    }
  };

  /* ============================= CHECKOUT ============================= */

  const checkout = async (
    paymentMethod
  ) => {
    if (cart.length === 0) {
      notify(
        "السلة فاضية، أضيفي منتج الأول 🙂"
      );

      return;
    }

    const phone = guestInfo.phone.trim();

    if (!phone || !guestInfo.address.trim()) {
      notify("من فضلك املئي رقم الموبايل والعنوان");
      return;
    }

    if (!/^01[0125][0-9]{8}$/.test(phone)) {
      notify("من فضلك أدخل رقم موبايل مصري صحيح");
      return;
    }

    // if (
    //   !guestInfo.phone.trim() ||
    //   !guestInfo.address.trim()
    // ) {
    //   notify(
    //     "من فضلك املئي رقم الموبايل والعنوان"
    //   );

    //   return;
    // }

    setCheckingOut(true);

    try {

      const d = await api.post(
        "/orders",
        {
          items: cart.map((i) => ({
            id: i.id,
            qty: i.qty
          })),
          paymentMethod,

          customerName: currentUser
            ? currentUser.name
            : guestInfo.customerName.trim(),

          phone: guestInfo.phone.trim(),
          address: guestInfo.address.trim(),
          city: guestInfo.city.trim(),
          governorate: guestInfo.governorate.trim(),
          notes: guestInfo.notes.trim(),
        }
      );



      if (paymentMethod === "card") {
        const pay =
          await api.post(
            "/payments/paymob/initiate",
            {
              orderId: d.order.id
            }
          );

        /*
          Clear only THIS user's cart.
          Because cart state belongs to currentUser.
        */

        setCart([]);

        window.location.href =
          pay.iframeUrl;

        return;
      }

      /*
        Order successfully created.
        Empty current user's cart.
      */

      setCart([]);

      if (!currentUser) {
        localStorage.removeItem("nour_store_guest_cart");

        setGuestInfo({
          customerName: "",
          phone: "",
          address: "",
          city: "",
          governorate: "",
          notes: "",
        });
      }
      setCartOpen(false);

      notify(
        "تم إرسال طلبك بنجاح، شكرًا لتسوقك من نور! ✨"
      );

      if (view === "account") {
        const dd =
          await api.get(
            "/orders/mine"
          );

        setOrders(dd.orders);
      }
    } catch (err) {
      notify(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  /* ============================= LOGIN ============================= */

  const login = async (
    email,
    password
  ) => {
    const d = await api.post(
      "/auth/login",
      {
        email,
        password
      }
    );

    /*
      VERY IMPORTANT:

      Clear the current cart immediately
      before switching users.

      This prevents the old user's cart
      from being visible even for a moment.
    */

    setCart([]);
    setCartOpen(false);

    api.setToken(d.token);

    /*
      Setting currentUser will trigger
      the cart useEffect above.

      That effect will load:
      cart_user_<new user id>
    */

    setCurrentUser(d.user);

    setView(
      d.user.role === "admin"
        ? "admin"
        : "account"
    );

    window.history.pushState(
      {},
      "",
      d.user.role === "admin"
        ? "/admin"
        : "/account"
    );

    notify(
      `أهلًا بعودتك، ${d.user.name}`
    );
  };

  /* ============================= REGISTER ============================= */

  const register = async (
    name,
    email,
    password
  ) => {
    const d = await api.post(
      "/auth/register",
      {
        name,
        email,
        password
      }
    );

    /*
      Start the newly created account
      with an empty cart.
    */

    setCart([]);
    setCartOpen(false);

    api.setToken(d.token);

    setCurrentUser(d.user);

    setView("account");
    window.history.pushState({}, "", "/account");
    notify(
      "تم إنشاء حسابك بنجاح 🌟"
    );
  };

  /* ============================= LOGOUT ============================= */

  const logout = () => {
    /*
      The cart is already saved automatically
      by the cart useEffect.

      We DON'T delete the user's cart from
      localStorage.

      So when X logs back in later,
      X gets X's cart back.
    */

    setCart([]);
    setCartOpen(false);

    api.setToken(null);

    setCurrentUser(null);

    setGuestInfo({
      customerName: "",
      phone: "",
      address: "",
      city: "",
      governorate: "",
      notes: "",
    });

    setOrders([]);

    setView("home");
    setSelectedProductId(null);

    window.history.pushState({}, "", "/");
    notify(
      "تم تسجيل الخروج"
    );
  };

  /* ============================= PROFILE ============================= */

  const updateProfile = async (
    profile
  ) => {
    // Profile editing endpoint isn't exposed by the API yet; update locally for now.

    setCurrentUser((u) => ({
      ...u,
      name: profile.name
    }));

    notify(
      "تم حفظ التعديلات"
    );
  };
  /* ============================= PRODUCTS ============================= */

  const saveProduct = async (formData, productId = null) => {
    if (productId) {
      const d = await api.put(
        `/products/${productId}`,
        formData
      );

      setProducts((prev) =>
        prev.map((x) =>
          x.id === productId
            ? d.product
            : x
        )
      );
    } else {
      const d = await api.post(
        "/products",
        formData
      );

      setProducts((prev) => [
        d.product,
        ...prev
      ]);
    }
  };
  const deleteProduct = async (id) => {
    try {
      const d = await api.del(`/products/${id}`);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? d.product
            : p
        )
      );

      notify("تم حذف المنتج بنجاح 🗑️");
    } catch (err) {
      console.error(err);

      notify(
        err.message || "تعذر حذف المنتج"
      );
    }
  };
  const reactivateProduct = async (id) => {
    const d = await api.put(
      `/products/${id}`,
      { isActive: true }
    );

    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? d.product
          : p
      )
    );
  };

  /* ============================= ORDER STATUS ============================= */

  const updateOrderStatus = async (
    id,
    status
  ) => {
    try {
      const d =
        await api.patch(
          `/orders/${id}/status`,
          {
            status
          }
        );

      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? d.order
            : o
        )
      );
    } catch (err) {
      notify(err.message);
    }
  };



  const onDeleteOrder = async () => {
    if (!deleteOrderId) return;

    setDeletingOrder(true);

    try {
      await api.del(`/orders/${deleteOrderId}`);

      setOrders((prev) =>
        prev.filter(
          (order) => order.id !== deleteOrderId
        )
      );

      setDeleteOrderId(null);

      notify("تم حذف الطلب بنجاح 🗑️");
    } catch (err) {
      console.error(err);

      notify(
        err.message ||
        "تعذر حذف الطلب"
      );
    } finally {
      setDeletingOrder(false);
    }
  };
  const openDeleteOrderModal = (orderId) => {
    setDeleteOrderId(orderId);
  };


  /* ============================= CART COUNT ============================= */

  const cartCount = cart.reduce(
    (s, i) => s + i.qty,
    0
  );

  /* ============================= UI ============================= */

  return (
    <div
      dir="rtl"
      style={{
        ...body,
        background: C.ink,
        minHeight: "100vh",
        color: C.ivory
      }}
    ><Header
        view={view}
        setView={setView}
        cartCount={cartCount}
        onOpenCart={() =>
          setCartOpen(true)
        }
        currentUser={currentUser}
        onLogout={logout}
        setMobileOpen={setMobileOpen}
        search={search}
        setSearch={setSearch}
        catFilter={catFilter}
        setCatFilter={setCatFilter}
        previousCategory={previousCategory}
        setPreviousCategory={setPreviousCategory}
        setProductsPage={setProductsPage}
      />
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        setView={setView}
        setSearch={setSearch}
      />
      {view === "home" && (
        <>
          <Hero
            setView={setView}
          />

          <FeaturedProductsSlider
            products={products}
            loading={productsLoading}
            onAdd={addToCart}
            openProduct={openProduct}
            openShop={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth"
              });

              setView("shop");
              window.history.pushState({}, "", "/shop");



            }}
          />
          <CategoryStrip
            setView={setView}
            setCatFilter={setCatFilter}
          />

          <WhyNourStore />
        </>
      )

      }

      {view === "shop" && (
        <Shop
          products={products}
          loading={productsLoading}
          onAdd={addToCart}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
          search={search}
          setSearch={setSearch}
          setView={setView}
          openProduct={openProduct}
          productsPage={productsPage}
          setProductsPage={setProductsPage}
          productsPagination={productsPagination}
        />
      )}



      {view === "product" && (
        productsLoading ? (
          <section
            style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
            }}
          >
            <Loader2
              size={32}
              style={{
                color: C.gold,
                animation: "spin 1s linear infinite",
              }}
            />
          </section>
        ) : selectedProduct ? (
          <ProductDetails
            product={selectedProduct}
            onAdd={addToCart}
            onBack={() => {
              setSearch("");

              if (productPreviousView === "home") {
                setView("home");

                window.history.pushState(
                  {},
                  "",
                  "/"
                );

                window.scrollTo({
                  top: 0,
                  behavior: "smooth"
                });

                return;
              }

              setCatFilter(productPreviousCategory || "الكل");
              setView("shop");

              window.history.pushState(
                {},
                "",
                "/shop"
              );

              window.scrollTo({
                top: 0,
                behavior: "smooth"
              });
            }}
          />
        ) : (
          <section
            style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
              textAlign: "center"
            }}
          >
            <div>
              <div
                style={{
                  color: C.gold,
                  fontSize: "3rem",
                  marginBottom: 15
                }}
              >
                404
              </div>

              <h2
                style={{
                  ...display,
                  color: C.ivory,
                  margin: "0 0 10px"
                }}
              >
                المنتج غير موجود
              </h2>

              <p
                style={{
                  color: C.ivoryDim,
                  margin: "0 0 25px"
                }}
              >
                المنتج الذي تبحثين عنه غير متوفر أو تم حذفه.
              </p>

              <button
                onClick={() => {
                  setView("shop");
                  window.history.pushState(
                    {},
                    "",
                    "/"
                  );
                }}
                style={{
                  padding: "11px 20px",
                  borderRadius: 6,
                  border: `1px solid ${C.gold}`,
                  background: C.gold,
                  color: C.ink,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                العودة للمتجر
              </button>
            </div>
          </section>
        )
      )}

      {view === "login" && (
        <LoginPage
          onLogin={login}
          setView={setView}
        />
      )}

      {view === "register" && (
        <RegisterPage
          onRegister={register}
          setView={setView}
        />
      )}

      {view === "account" &&
        currentUser && (
          <AccountDashboard
            user={currentUser}
            orders={orders}
            ordersLoading={
              ordersLoading
            }
            onUpdateProfile={
              updateProfile
            }
          />
        )}

      {view === "admin" &&
        currentUser?.role ===
        "admin" && (
          <AdminDashboard
            products={products}
            orders={orders}
            ordersLoading={ordersLoading}
            customers={customers}
            onSaveProduct={saveProduct}
            onDeleteProduct={deleteProduct}
            reactivateProduct={reactivateProduct}
            onNotify={notify}
            onUpdateOrderStatus={updateOrderStatus}
            onDeleteOrder={onDeleteOrder}
            onOpenDeleteOrder={openDeleteOrderModal}
          />
        )}

      <Footer />

      <BackToTop />
      <FloatingWhatsApp />


      <CartDrawer
        open={cartOpen}
        onClose={() =>
          setCartOpen(false)
        }
        cart={cart}
        onInc={incItem}
        onDec={decItem}
        onRemove={removeItem}
        onCheckout={checkout}
        checkingOut={checkingOut}
        currentUser={currentUser}
        guestInfo={guestInfo}
        setGuestInfo={setGuestInfo}
      />



      <Toast message={toast} />

      {deleteOrderId && (
        <div
          onClick={() => {
            if (!deletingOrder) {
              setDeleteOrderId(null);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.72)",
            backdropFilter: "blur(5px)",
            WebkitBackdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 420,
              background: C.panel,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: 28,
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                margin: "0 auto 18px",
                borderRadius: "50%",
                background: "rgba(220, 80, 80, 0.10)",
                border: "1px solid rgba(220, 80, 80, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2
                size={24}
                style={{
                  color: C.danger,
                }}
              />
            </div>

            <h3
              style={{
                color: C.ivory,
                margin: "0 0 10px",
                fontSize: "1.1rem",
              }}
            >
              حذف الطلب
            </h3>

            <p
              style={{
                color: C.taupe,
                margin: "0 0 24px",
                fontSize: ".85rem",
                lineHeight: 1.7,
              }}
            >
              هل أنت متأكد من حذف هذا الطلب؟
              <br />
              لا يمكن التراجع عن هذه العملية.
            </p>

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                disabled={deletingOrder}
                onClick={() => setDeleteOrderId(null)}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: 7,
                  border: `1px solid ${C.line}`,
                  background: "transparent",
                  color: C.ivory,
                  cursor: deletingOrder
                    ? "not-allowed"
                    : "pointer",
                  fontFamily: "inherit",
                }}
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={deletingOrder}
                onClick={onDeleteOrder}
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  borderRadius: 7,
                  border: "none",
                  background: C.danger,
                  color: "#fff",
                  cursor: deletingOrder
                    ? "not-allowed"
                    : "pointer",
                  fontFamily: "inherit",
                  fontWeight: 700,
                  opacity: deletingOrder ? 0.7 : 1,
                }}
              >
                {deletingOrder
                  ? "جارِ الحذف..."
                  : "حذف الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

