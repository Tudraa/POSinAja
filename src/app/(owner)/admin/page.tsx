export default function AdminPage() {
  return (
    <div className="py-6">
      <div>
        <h2 className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">
          Dashboard
        </h2>
        <p className="text-on-surface-variant font-medium mt-1">
          Welcome to the POSinAja management portal.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats Cards */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow ghost-border">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Total Revenue</p>
          <p className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">—</p>
          <p className="text-sm text-on-surface-variant mt-1">Data akan muncul dari laporan</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow ghost-border">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Active Products</p>
          <p className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">—</p>
          <p className="text-sm text-on-surface-variant mt-1">Cek halaman Products</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-6 ambient-shadow ghost-border">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Team Members</p>
          <p className="text-3xl font-extrabold font-headline text-on-surface tracking-tight">—</p>
          <p className="text-sm text-on-surface-variant mt-1">Cek halaman Employees</p>
        </div>
      </div>
    </div>
  );
}
