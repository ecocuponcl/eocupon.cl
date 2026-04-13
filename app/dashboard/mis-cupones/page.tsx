"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CouponCard } from "@/components/coupon-card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

interface Coupon {
  id: string
  title: string
  description: string | null
  discount_percentage: number
  coupon_code: string
  business_name: string
  image_url: string | null
  is_public: boolean
  expires_at: string | null
  shares_count: number
  created_at: string
}

export default function MisCuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  useEffect(() => {
    async function fetchCoupons() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setCoupons(data)
      }
      setLoading(false)
    }

    fetchCoupons()
  }, [supabase])

  const filteredCoupons = coupons.filter(coupon =>
    coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.coupon_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", id)

    if (!error) {
      setCoupons(coupons.filter(c => c.id !== id))
    }
  }

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    const { error } = await supabase
      .from("coupons")
      .update({ is_public: !isPublic })
      .eq("id", id)

    if (!error) {
      setCoupons(coupons.map(c => 
        c.id === id ? { ...c, is_public: !isPublic } : c
      ))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Cupones</h1>
          <p className="text-muted-foreground">
            Tienes {coupons.length} {coupons.length === 1 ? "cupon" : "cupones"} creados
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/dashboard/crear">
            <Plus className="mr-2 h-4 w-4" />
            Crear Nuevo
          </Link>
        </Button>
      </div>

      {coupons.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cupones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      )}

      {filteredCoupons.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-secondary-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? "No se encontraron cupones" : "No tienes cupones aun"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? "Intenta con otros terminos de busqueda"
              : "Crea tu primer cupon con IA y compartelo con el mundo"
            }
          </p>
          {!searchTerm && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/dashboard/crear">
                <Plus className="mr-2 h-4 w-4" />
                Crear mi primer cupon
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCoupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              onDelete={() => handleDelete(coupon.id)}
              onTogglePublic={() => handleTogglePublic(coupon.id, coupon.is_public)}
              showActions
            />
          ))}
        </div>
      )}
    </div>
  )
}
