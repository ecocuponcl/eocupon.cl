import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty } from "@/components/ui/empty"
import { Plus, Ticket, Eye, Share2 } from "lucide-react"
import { CouponCard } from "@/components/coupon-card"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })

  const stats = {
    total: coupons?.length || 0,
    views: coupons?.reduce((acc, c) => acc + (c.views || 0), 0) || 0,
    shares: coupons?.reduce((acc, c) => acc + (c.shares || 0), 0) || 0,
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Cupones</h1>
          <p className="text-muted-foreground">Gestiona y crea nuevos cupones de descuento</p>
        </div>
        <Link href="/dashboard/crear">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Crear nuevo cupón
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Ticket className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Cupones creados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/50">
              <Eye className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.views}</p>
              <p className="text-sm text-muted-foreground">Visualizaciones</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/50">
              <Share2 className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.shares}</p>
              <p className="text-sm text-muted-foreground">Compartidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coupons Grid */}
      {coupons && coupons.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} />
          ))}
        </div>
      ) : (
        <Empty
          icon={<Ticket className="h-10 w-10" />}
          title="Sin cupones todavía"
          description="Crea tu primer cupón de descuento con IA y comienza a promocionar tu negocio"
          action={
            <Link href="/dashboard/crear">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Crear mi primer cupón
              </Button>
            </Link>
          }
        />
      )}
    </div>
  )
}
