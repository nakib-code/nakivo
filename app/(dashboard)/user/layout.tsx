import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { isStaffRole } from "@/lib/roles";
import UserHeader from "@/components/user/UserHeader";
import UserSidebar from "@/components/user/UserSidebar";


export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (isStaffRole(user.role)) {
    redirect("/admin");
  }

  return (

    <div className="min-h-screen bg-slate-50">


      {/* Desktop Sidebar */}

      <aside
        className="
          fixed
          left-0
          top-0
          hidden
          h-screen
          w-64
          border-r
          bg-white
          p-5
          md:block
        "
      >

        <UserSidebar />

      </aside>



      {/* Content */}

      <div className="md:ml-64">


        <UserHeader />


        <main className="p-4 md:p-6">

          {children}

        </main>


      </div>


    </div>

  );
}