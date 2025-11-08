import { useAuction } from '../context/AuctionContext';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { useMemo } from 'react';
import { ChartBar, Info } from 'lucide-react';

export function DashboardPage() {
  const { state, getAuctionStats } = useAuction();
  const stats = getAuctionStats();

  // === Data Preparation ===

  // 1. Items per auction
  const itemsPerAuction = useMemo(() => {
    return state.auctions.map(a => ({
      name: a.auction_name,
      items: state.items.filter(i => i.auction_id === a.auction_id).length,
    }));
  }, [state]);

  // 2. Comps distribution by source
  const compsBySource = useMemo(() => {
    const counts = {};
    state.comps.forEach(c => {
      counts[c.source] = (counts[c.source] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [state]);

  // 3. Items created over time (line chart)
  const itemsOverTime = useMemo(() => {
    const grouped = {};
    state.items.forEach(i => {
      const date = new Date(i.created_at).toLocaleDateString('en-GB');
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }, [state]);

  const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc'];

  return (
    <div className="space-y-8">
      {/* === Page Header === */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your auctions and recent activity
        </p>
      </div>

      {/* === Quick Stats === */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Auctions</CardTitle>
            <p className="text-muted-foreground">All auctions you’ve created</p>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.totalAuctions}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Items</CardTitle>
            <p className="text-muted-foreground">Across all auctions</p>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{stats.totalItems}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Recent</CardTitle>
            <p className="text-muted-foreground">Your latest auction</p>
          </CardHeader>
          <CardContent className="text-xl font-medium">
            {state.auctions[state.auctions.length - 1]?.auction_name || 'N/A'}
          </CardContent>
        </Card>
      </div>

      {/* === Recent Auctions === */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ChartBar className="w-5 h-5" /> Recent Auctions
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.auctions.slice(-3).reverse().map(a => (
            <Card key={a.auction_id}>
              <CardHeader>
                <CardTitle>{a.auction_name}</CardTitle>
                <p className="text-muted-foreground">
                  Created {new Date(a.created_at).toLocaleDateString('en-GB')}
                </p>
              </CardHeader>
              <CardContent>
                <Link
                  to={`/auction/${a.auction_id}`}
                  className="inline-block border px-3 py-2 rounded-md hover:bg-gray-100"
                >
                  View
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* === Summary Analytics === */}
      <div className="mt-10 space-y-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Info className="w-5 h-5" /> Summary Analytics
        </h2>

        {/* Charts Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Items per auction */}
          <Card>
            <CardHeader>
              <CardTitle>Items per Auction</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={itemsPerAuction}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="items" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Comps by Source */}
          <Card>
            <CardHeader>
              <CardTitle>Comps by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={compsBySource}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {compsBySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Items over time */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Items Created Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={itemsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* === Tip Section === */}
      <Card className="bg-muted/50 mt-10">
        <CardHeader>
          <CardTitle>Tip</CardTitle>
          <p className="text-muted-foreground">
            Keep your auctions organized — use descriptive names and check stats here regularly.
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}
