"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { CouponCard } from "@/components/coupon-card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Plus, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Coupon {
  id: string
  title: string
  discount_percentage: number
  coupon_code: string
  business_name: string
  generated_image_url: string | null
  logo_url: string | null
  is_public: boolean
  views: number
  shares_count: number
  created_at: string
}

export default function MisCuponesPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function fetchCoupons() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("coupons")
        .select("id, title, business_name, coupon_code, discount_percentage, generated_image_url, logo_url, is_public, views, shares_count, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        setError("No pudimos cargar tus cupones. Intenta recargar la página.")
      } else if (data) {
        setCoupons(data)
      }
      setLoading(false)
    }

    fetchCoupons()
  }, [])

  const filteredCoupons = coupons.filter(coupon =>
    coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.coupon_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return
    setError(null)
    setDeleting(true)

    const supabase = createClient()

    // Borrar el logo de Storage antes de borrar el cupón
    if (pendingDelete.logo_url) {
      try {
        // La URL tiene formato: .../storage/v1/object/public/logos/{userId}/{timestamp}.{ext}
        const urlParts = pendingDelete.logo_url.split("/logos/")
        if (urlParts.length === 2) {
          await supabase.storage.from("logos").remove([urlParts[1]])
        }
      } catch (storageErr) {
        // No bloqueamos el borrado del cupón si falla el logo
        console.error("No se pudo borrar el logo:", storageErr)
      }
    }

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", pendingDelete.id)

    if (error) {
      setError("No se pudo eliminar el cupón.")
      setDeleting(false)
      setPendingDelete(null)
      return
    }

    setCoupons(coupons.filter(c => c.id !== pendingDelete.id))
    setDeleting(false)
    setPendingDelete(null)
  }

  const handleTogglePublic = async (id: string, isPublic: boolean) => {
    setError(null)
    const supabase = createClient()
    const { error } = await supabase
      .from("coupons")
      .update({ is_public: !isPublic })
      .eq("id", id)

    if (error) {
      setError("No se pudo cambiar la visibilidad del cupón.")
      return
    }
    setCoupons(coupons.map(c =>
      c.id === id ? { ...c, is_public: !isPublic } : c
    ))
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
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Cupones</h1>
          <p className="text-muted-foreground">
            Tienes {coupons.length} {coupons.length === 1 ? "cupón" : "cupones"} creados
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
          <Button variant="outline" size="icon" aria-label="Filtrar cupones">
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
            {searchTerm ? "No se encontraron cupones" : "No tienes cupones aún"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Intenta con otros términos de búsqueda"
              : "Crea tu primer cupón y compártelo con tus clientes"
            }
          </p>
          {!searchTerm && (
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/dashboard/crear">
                <Plus className="mr-2 h-4 w-4" />
                Crear mi primer cupón
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
              onDelete={() => setPendingDelete(coupon)}
              onTogglePublic={() => handleTogglePublic(coupon.id, coupon.is_public)}
              showActions
            />
          ))}
        </div>
      )}

      {/* Diálogo de confirmación de borrado */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este cupón?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente el cupón{" "}
              <span className="font-semibold">"{pendingDelete?.title}"</span>{" "}
              y su imagen. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Eliminando…" : "Sí, eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
