"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2, Loader2, Plus } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HeroBanner {
  _id: string;

  title: string;

  description: string;

  image: string;

  buttonText: string;

  buttonLink: string;

  active: boolean;
}

export default function HeroListPage() {
  const [heroes, setHeroes] = useState<HeroBanner[]>([]);

  const [loading, setLoading] = useState(true);

  const [deleting, setDeleting] = useState<string | null>(null);

  // =========================
  // Fetch Heroes
  // =========================

  const fetchHeroes = async () => {
    try {
      const res = await fetch("/api/admin/hero", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load heroes");
      }

      setHeroes(data.data || []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load heroes",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroes();
  }, []);

  // =========================
  // Delete Hero
  // =========================

  const deleteHero = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this hero?",
    );

    if (!confirmDelete) return;

    try {
      setDeleting(id);

      const res = await fetch(`/api/admin/hero/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Delete failed");
      }

      toast.success("Hero deleted successfully");

      setHeroes((prev) => prev.filter((hero) => hero._id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div
        className="
flex
items-center
justify-center
py-20
"
      >
        <Loader2
          className="
h-8
w-8
animate-spin
"
        />
      </div>
    );
  }

  return (
    <div
      className="
space-y-6
"
    >
      {/* Header */}

      <div
        className="
flex
items-center
justify-between
"
      >
        <div>
          <h1
            className="
text-2xl
font-bold
"
          >
            Hero Banners
          </h1>

          <p
            className="
text-sm
text-muted-foreground
"
          >
            Manage homepage hero banners
          </p>
        </div>

        <Link href="/admin/hero/create">
          <Button>
            <Plus
              className="
mr-2
h-4
w-4
"
            />
            Add Hero
          </Button>
        </Link>
      </div>

      {heroes.length === 0 ? (
        <Card>
          <CardContent
            className="
py-10
text-center
text-muted-foreground
"
          >
            No hero banner found
          </CardContent>
        </Card>
      ) : (
        <div
          className="
grid
gap-6
md:grid-cols-2
xl:grid-cols-3
"
        >
          {heroes.map((hero) => (
            <Card
              key={hero._id}
              className="
overflow-hidden
"
            >
              {/* Image */}

              <div
                className="
relative
h-52
w-full
"
              >
                <Image
                  src={hero.image}
                  alt={hero.title}
                  fill
                  className="
object-cover
"
                />
              </div>

              <CardHeader>
                <CardTitle>{hero.title}</CardTitle>
              </CardHeader>

              <CardContent
                className="
space-y-4
"
              >
                <p
                  className="
line-clamp-2
text-sm
text-muted-foreground
"
                >
                  {hero.description}
                </p>

                <div
                  className="
text-sm
"
                >
                  <span
                    className="
font-semibold
"
                  >
                    Button:
                  </span>{" "}
                  {hero.buttonText}
                </div>

                <div
                  className="
text-sm
"
                >
                  <span
                    className="
font-semibold
"
                  >
                    Link:
                  </span>{" "}
                  {hero.buttonLink}
                </div>

                <div
                  className="
flex
items-center
justify-between
pt-3
"
                >
                  <span
                    className={`
rounded-full
px-3
py-1
text-xs
font-medium

${hero.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}

`}
                  >
                    {hero.active ? "Active" : "Inactive"}
                  </span>

                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleting === hero._id}
                    onClick={() => deleteHero(hero._id)}
                  >
                    {deleting === hero._id ? (
                      <Loader2
                        className="
h-4
w-4
animate-spin
"
                      />
                    ) : (
                      <Trash2
                        className="
h-4
w-4
"
                      />
                    )}

                    <span className="ml-2">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
