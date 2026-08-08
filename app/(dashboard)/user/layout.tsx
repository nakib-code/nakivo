import UserHeader from "@/components/user/UserHeader";
import UserSidebar from "@/components/user/UserSidebar";


export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {

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