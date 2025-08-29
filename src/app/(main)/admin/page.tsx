
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth, useStalls } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, LogIn, ShieldCheck, LayoutDashboard, ListTree, PlusCircle, Users, Home, Edit, Save, Building, Hash, Zap, CloudUpload, CloudOff, NotebookText, Wrench, Eraser, Umbrella, TrendingUp, DollarSign, Landmark, Terminal, Wallet, Bluetooth, Clock, UserSearch, Search, MinusCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Stall, User, RentalHistory, ActiveRental, RentalLog } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { GeoPoint, collection, getDocs, doc, updateDoc as firestoreUpdateDoc, setDoc, query, where, Timestamp, increment, getDoc } from 'firebase/firestore';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from '@/components/ui/separator';


const ADMIN_EMAIL = "admin@u-dry.com";

type ActivityLog = {
    type: 'rent' | 'return';
    user: User;
    stallName: string;
    timestamp: number;
    rentalDetails: RentalHistory | ActiveRental;
};

type UserSearchResult = {
  user: User;
  rentalHistory: RentalHistory[];
} | null;


export default function AdminPage() {
  const { user, isReady, firebaseServices } = useAuth();
  const { stalls, isLoadingStalls } = useStalls();
  const router = useRouter();
  const { translate } = useLanguage();
  const { toast } = useToast();
  
  const [newStallName, setNewStallName] = useState('');
  const [newStallDvid, setNewStallDvid] = useState('');
  const [newStallBtName, setNewStallBtName] = useState('');
  const [newStallAddress, setNewStallAddress] = useState('');
  const [newStallCapacity, setNewStallCapacity] = useState('');
  const [newStallLat, setNewStallLat] = useState('');
  const [newStallLng, setNewStallLng] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [editingStallId, setEditingStallId] = useState<string | null>(null);
  const [editedStallName, setEditedStallName] = useState('');
  const [editedStallDvid, setEditedStallDvid] = useState('');
  const [editedBtName, setEditedBtName] = useState('');
  const [editedStallAddress, setEditedStallAddress] = useState('');
  const [editedStallLat, setEditedStallLat] = useState<number>(0);
  const [editedStallLng, setEditedStallLng] = useState<number>(0);
  const [editedNextActionSlot, setEditedNextActionSlot] = useState<number>(1);
  const [togglingDeployId, setTogglingDeployId] = useState<string | null>(null);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [rentalHistories, setRentalHistories] = useState<RentalHistory[]>([]);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState(true); 
  const [adminDataError, setAdminDataError] = useState<string | null>(null);

  const [uidToReset, setUidToReset] = useState('');
  const [isResettingUser, setIsResettingUser] = useState(false);
  
  const [searchEmail, setSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<UserSearchResult>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);


  const isSuperAdminUser = user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
  const deployedStallsCount = stalls.filter(s => s.isDeployed).length;

  useEffect(() => {
    if (isReady && !user) {
      router.replace('/auth/signin?redirect=/admin');
    }
  }, [user, isReady, router]);

  const fetchAdminData = useCallback(async () => {
    if (!firebaseServices?.db || !isSuperAdminUser) {
      setIsLoadingAdminData(false);
      return;
    }
    setIsLoadingAdminData(true);
    setAdminDataError(null);
    try {
      const usersCollectionRef = collection(firebaseServices.db, 'users');
      const usersSnapshot = await getDocs(usersCollectionRef);
      const usersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as User[];
      setAllUsers(usersData);

      const rentalsCollectionRef = collection(firebaseServices.db, 'rentals');
      const rentalsSnapshot = await getDocs(rentalsCollectionRef);
      const rentalsData = rentalsSnapshot.docs.map(doc => doc.data()) as RentalHistory[];
      setRentalHistories(rentalsData);

    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      if (error.code === 'permission-denied') {
        setAdminDataError("Permission Denied: Check your Firestore security rules for admin access.");
      } else {
        setAdminDataError(`An error occurred: ${error.message}`);
      }
    } finally {
      setIsLoadingAdminData(false);
    }
  }, [firebaseServices, isSuperAdminUser]);

  useEffect(() => {
    if (isReady && user) {
        fetchAdminData();
    }
  }, [isReady, user, fetchAdminData]);
  
  const handleRegisterStall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseServices?.db) return;
    setIsRegistering(true);

    if (!newStallName || !newStallDvid || !newStallBtName || !newStallAddress || !newStallCapacity || !newStallLat || !newStallLng) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all fields to register a machine." });
      setIsRegistering(false);
      return;
    }
    if (stalls.some(stall => stall.dvid === newStallDvid)) {
        toast({ variant: "destructive", title: "Duplicate DVID", description: "A machine with this DVID is already registered." });
        setIsRegistering(false);
        return;
    }
    const capacity = parseInt(newStallCapacity, 10);
    const lat = parseFloat(newStallLat);
    const lng = parseFloat(newStallLng);

    if (isNaN(capacity) || isNaN(lat) || isNaN(lng)) {
      toast({ variant: "destructive", title: "Invalid Number", description: "Capacity, Latitude, and Longitude must be valid numbers." });
      setIsRegistering(false);
      return;
    }
    
    try {
      const stallDoc: Omit<Stall, 'id'> = {
        dvid: newStallDvid,
        name: newStallName,
        address: newStallAddress,
        location: new GeoPoint(lat, lng),
        availableUmbrellas: capacity, 
        totalUmbrellas: capacity,
        nextActionSlot: 1, 
        isDeployed: false, 
        btName: newStallBtName
      };
      const stallDocRef = doc(firebaseServices.db, 'stalls', stallDoc.dvid);
      await setDoc(stallDocRef, stallDoc);
      toast({ title: "Machine Registered", description: `Machine ${stallDoc.name} has been added.` });
      setNewStallName(''); setNewStallDvid(''); setNewStallAddress(''); setNewStallCapacity(''); setNewStallLat(''); setNewStallLng(''); setNewStallBtName('');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
      console.error("Error adding stall: ", error);
    }
    finally {
      setIsRegistering(false);
    }
  };
  
  const handleSearchUser = async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!firebaseServices?.db || !searchEmail) return;

      setIsSearching(true);
      setSearchError(null);
      setSearchResult(null);

      try {
        const usersRef = collection(firebaseServices.db, 'users');
        const qUser = query(usersRef, where("email", "==", searchEmail.trim()));
        const userSnapshot = await getDocs(qUser);

        if (userSnapshot.empty) {
          setSearchError(`No user found with the email: ${searchEmail}`);
          return;
        }

        const foundUserDoc = userSnapshot.docs[0];
        const foundUser = { uid: foundUserDoc.id, ...foundUserDoc.data() } as User;

        const rentalsRef = collection(firebaseServices.db, 'rentals');
        const qRentals = query(rentalsRef, where("userId", "==", foundUser.uid));
        const rentalSnapshot = await getDocs(qRentals);

        const rentalHistory = rentalSnapshot.docs.map(doc => doc.data() as RentalHistory)
          .sort((a, b) => b.startTime - a.startTime);

        setSearchResult({
          user: foundUser,
          rentalHistory: rentalHistory
        });

      } catch (error: any) {
        setSearchError(error.message);
        toast({ variant: "destructive", title: "Search Failed", description: error.message });
      } finally {
        setIsSearching(false);
      }
  };
  
  const handleBalanceAdjustment = async (type: 'add' | 'deduct') => {
    if (!firebaseServices?.db || !searchResult?.user.uid) return;

    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
        toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid positive number." });
        return;
    }

    setIsAdjustingBalance(true);
    try {
        const userDocRef = doc(firebaseServices.db, 'users', searchResult.user.uid);
        const adjustmentValue = type === 'add' ? amount : -amount;

        await firestoreUpdateDoc(userDocRef, {
            balance: increment(adjustmentValue)
        });

        toast({ title: "Balance Updated", description: `Successfully ${type === 'add' ? 'added' : 'deducted'} HK$${amount.toFixed(2)}.` });
        
        // Refresh user data in the search result
        const updatedUserDoc = await getDoc(userDocRef);
        if(updatedUserDoc.exists()) {
           setSearchResult(prev => prev ? { ...prev, user: { uid: updatedUserDoc.id, ...updatedUserDoc.data() } as User } : null);
        }
        setAdjustmentAmount('');

    } catch (error: any) {
        toast({ variant: "destructive", title: "Update Failed", description: error.message });
    } finally {
        setIsAdjustingBalance(false);
    }
  };

  const handleSaveStallDetails = async () => {
    if (!editingStallId || !firebaseServices?.db) return;
    try {
      const stallDocRef = doc(firebaseServices.db, 'stalls', editingStallId);
      await firestoreUpdateDoc(stallDocRef, {
        name: editedStallName,
        dvid: editedStallDvid,
        btName: editedBtName,
        address: editedStallAddress,
        location: new GeoPoint(editedStallLat, editedStallLng),
        nextActionSlot: editedNextActionSlot,
      });
      toast({ title: "Machine Updated", description: `Details for ${editedStallName} have been saved.` });
      setEditingStallId(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  const handleToggleDeploy = async (stall: Stall) => {
    if (!firebaseServices?.db) return;
    setTogglingDeployId(stall.dvid);
    try {
      const newDeployStatus = !stall.isDeployed;
      const stallDocRef = doc(firebaseServices.db, 'stalls', stall.dvid);
      await firestoreUpdateDoc(stallDocRef, { isDeployed: newDeployStatus });
      toast({ title: "Deployment Status Updated", description: `${stall.name} has been ${newDeployStatus ? 'deployed' : 'un-deployed'}.`});
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setTogglingDeployId(null);
    }
  };
  
  const handleClearRental = async () => {
    if (!firebaseServices?.db || !uidToReset) return;
    setIsResettingUser(true);
    try {
        const userDocRef = doc(firebaseServices.db, 'users', uidToReset);
        await firestoreUpdateDoc(userDocRef, { activeRental: null });
        toast({ title: 'User Reset', description: `Active rental cleared for user ${uidToReset}.` });
        setUidToReset('');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Reset Failed', description: error.message });
    } finally {
        setIsResettingUser(false);
    }
  };

  // --- DERIVED STATS & DATA ---
  const activeRentalsCount = allUsers.filter(u => u.activeRental).length;
  const totalUsersCount = allUsers.length;
  const totalCompletedRentals = rentalHistories.length;
  const totalRevenue = rentalHistories.reduce((sum, rental) => sum + (rental.finalCost || 0), 0);
  const totalDeposits = allUsers.reduce((sum, user) => sum + (user.deposit || 0), 0);
  const totalSpendableBalance = allUsers.reduce((sum, user) => sum + (user.balance || 0), 0);
  const totalUmbrellasCount = stalls.reduce((sum, s) => sum + s.totalUmbrellas, 0);

  const combinedActivityLog = useCallback((): ActivityLog[] => {
    if (!allUsers.length && !rentalHistories.length) return [];

    const userMap = new Map(allUsers.map(u => [u.uid, u]));

    const returnActivities: ActivityLog[] = rentalHistories.map(rental => ({
        type: 'return',
        user: userMap.get(rental.userId) || { uid: rental.userId, email: "Unknown User" },
        stallName: rental.returnedToStallName,
        timestamp: rental.endTime,
        rentalDetails: rental,
    }));

    const rentActivities: ActivityLog[] = allUsers
        .filter(user => user.activeRental)
        .map(user => ({
            type: 'rent',
            user: user,
            stallName: user.activeRental!.stallName,
            timestamp: user.activeRental!.startTime,
            rentalDetails: user.activeRental!,
        }));

    return [...returnActivities, ...rentActivities].sort((a, b) => b.timestamp - a.timestamp);
  }, [allUsers, rentalHistories]);

  const sortedActivityLog = combinedActivityLog();


  if (!isReady || isLoadingStalls) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">{translate('admin_verifying_access')}</p>
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader><CardTitle className="text-destructive flex items-center justify-center"><AlertTriangle className="mr-2 h-6 w-6" /> {translate('access_denied')}</CardTitle></CardHeader>
        <CardContent><p>{translate('admin_access_denied_desc')}</p><Button asChild className="mt-4"><Link href="/auth/signin?redirect=/admin" className="flex items-center"><LogIn className="mr-2 h-4 w-4" /> {translate('login')}</Link></Button></CardContent>
      </Card>
    </div>
  );

  if (!isSuperAdminUser) return (
    <div className="container mx-auto py-8 px-4 text-center">
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <AlertTriangle className="h-5 w-5" /><AlertTitle className="text-xl font-semibold">{translate('admin_access_denied_title')}</AlertTitle><AlertDescription className="mt-2">{translate('admin_access_denied_desc')}</AlertDescription>
      </Alert>
      <Button asChild className="mt-6"><Link href="/home" className="flex items-center"><Home className="mr-2 h-4 w-4" /> {translate('admin_go_to_homepage_button')}</Link></Button>
    </div>
  );
  
  return (
    <>
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-primary flex items-center"><ShieldCheck className="mr-3 h-8 w-8 text-accent" /> {translate('admin_panel_main_title')}</h1>
        <p className="text-muted-foreground text-sm sm:text-right">{translate('admin_welcome_message', { userName: user.displayName || user.email || 'Admin' })}</p>
      </div>

      <section>
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-2xl flex items-center"><LayoutDashboard className="mr-2 h-6 w-6 text-primary" /> {translate('admin_dashboard_overview_title')}</CardTitle><CardDescription>{translate('admin_dashboard_overview_desc')}</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Deployed / Total Stalls</CardTitle><ListTree className="text-muted-foreground h-5 w-5" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{`${deployedStallsCount} / ${stalls.length}`}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Umbrellas</CardTitle><Umbrella className="text-muted-foreground h-5 w-5" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{totalUmbrellasCount}</div></CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Rentals</CardTitle><TrendingUp className="text-muted-foreground h-5 w-5" /></CardHeader>
                <CardContent>
                    {isLoadingAdminData ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{activeRentalsCount}</div>}
                    {adminDataError && <p className="text-xs text-destructive mt-1">{adminDataError}</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle><Users className="text-muted-foreground h-5 w-5" /></CardHeader>
                <CardContent>
                    {isLoadingAdminData ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{totalUsersCount}</div>}
                    {adminDataError && <p className="text-xs text-destructive mt-1">{adminDataError}</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Completed Rentals</CardTitle><NotebookText className="text-muted-foreground h-5 w-5" /></CardHeader>
                <CardContent>
                    {isLoadingAdminData ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">{totalCompletedRentals}</div>}
                    {adminDataError && <p className="text-xs text-destructive mt-1">{adminDataError}</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="text-muted-foreground h-5 w-5" /></CardHeader>
                <CardContent>
                    {isLoadingAdminData ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">HK${totalRevenue.toFixed(2)}</div>}
                    {adminDataError && <p className="text-xs text-destructive mt-1">{adminDataError}</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total User Deposits</CardTitle><Landmark className="text-muted-foreground h-5 w-5" /></CardHeader>
                <CardContent>
                    {isLoadingAdminData ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">HK${totalDeposits.toFixed(2)}</div>}
                    {adminDataError && <p className="text-xs text-destructive mt-1">{adminDataError}</p>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Spendable Balance</CardTitle><Wallet className="text-muted-foreground h-5 w-5" /></CardHeader>
                <CardContent>
                    {isLoadingAdminData ? <Loader2 className="h-6 w-6 animate-spin"/> : <div className="text-2xl font-bold">HK${totalSpendableBalance.toFixed(2)}</div>}
                    {adminDataError && <p className="text-xs text-destructive mt-1">{adminDataError}</p>}
                </CardContent>
            </Card>
          </CardContent>
        </Card>
      </section>
      
      <section>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center"><UserSearch className="mr-2 h-6 w-6 text-primary" /> Customer Support: User Lookup</CardTitle>
              <CardDescription>Search for a user by their email to view their details, active rental, and rental history.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSearchUser}>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input 
                    type="email" 
                    placeholder="Enter user's email address" 
                    value={searchEmail} 
                    onChange={e => setSearchEmail(e.target.value)} 
                    disabled={isSearching}
                  />
                  <Button type="submit" disabled={isSearching || !searchEmail}>
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Search
                  </Button>
                </div>
              </CardContent>
            </form>

            <CardContent>
              {isSearching ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : searchError ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Search Error</AlertTitle>
                  <AlertDescription>{searchError}</AlertDescription>
                </Alert>
              ) : searchResult ? (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold text-primary">Search Result</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>{searchResult.user.displayName || searchResult.user.email}</CardTitle>
                      <CardDescription className="font-mono text-xs">{searchResult.user.uid}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                       <p><strong>Email:</strong> {searchResult.user.email}</p>
                       <p><strong>Deposit:</strong> HK${(searchResult.user.deposit || 0).toFixed(2)}</p>
                       <p><strong>Balance:</strong> HK${(searchResult.user.balance || 0).toFixed(2)}</p>
                       <p><strong>First Free Rental Used:</strong> {searchResult.user.hasHadFirstFreeRental ? 'Yes' : 'No'}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Balance Adjustment</CardTitle>
                        <CardDescription>Manually add or deduct from the user's spendable balance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="flex flex-col sm:flex-row gap-2 items-center">
                           <Input 
                            type="number"
                            placeholder="e.g., 5.00"
                            value={adjustmentAmount}
                            onChange={(e) => setAdjustmentAmount(e.target.value)}
                            disabled={isAdjustingBalance}
                           />
                           <div className="flex gap-2 w-full sm:w-auto">
                             <Button 
                                onClick={() => handleBalanceAdjustment('add')} 
                                disabled={isAdjustingBalance || !adjustmentAmount}
                                className="flex-1"
                             >
                               {isAdjustingBalance ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                               Add
                             </Button>
                             <Button 
                                onClick={() => handleBalanceAdjustment('deduct')} 
                                disabled={isAdjustingBalance || !adjustmentAmount}
                                variant="destructive"
                                className="flex-1"
                             >
                               {isAdjustingBalance ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <MinusCircle className="mr-2 h-4 w-4" />}
                               Deduct
                             </Button>
                           </div>
                         </div>
                    </CardContent>
                  </Card>

                  {searchResult.user.activeRental ? (
                    <div>
                      <h4 className="text-lg font-semibold mb-2">Active Rental</h4>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="active-rental">
                          <AccordionTrigger className="bg-secondary/50 px-4 rounded-md">
                            Rented from {searchResult.user.activeRental.stallName} at {new Date(searchResult.user.activeRental.startTime).toLocaleString()}
                          </AccordionTrigger>
                          <AccordionContent className="pt-2">
                            <h5 className="font-semibold px-4 pt-2">Diagnostic Log:</h5>
                            <ScrollArea className="h-40 border rounded-md m-2">
                              <pre className="text-xs p-2 whitespace-pre-wrap font-mono">{JSON.stringify(searchResult.user.activeRental.logs || [], null, 2)}</pre>
                            </ScrollArea>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  ) : (
                     <p className="text-sm text-muted-foreground">No active rental.</p>
                  )}
                  
                  <Separator />

                  <div>
                     <h4 className="text-lg font-semibold mb-2">Rental History ({searchResult.rentalHistory.length} trips)</h4>
                      {searchResult.rentalHistory.length > 0 ? (
                        <Accordion type="single" collapsible className="space-y-2">
                          {searchResult.rentalHistory.map(rental => (
                             <AccordionItem value={rental.rentalId} key={rental.rentalId}>
                              <AccordionTrigger className="bg-secondary/50 px-4 rounded-md text-sm">
                                <div className="flex flex-col md:flex-row justify-between w-full pr-4 text-left">
                                  <span>From: {rental.stallName}</span>
                                  <span className="text-muted-foreground">{new Date(rental.startTime).toLocaleString()}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-2 text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 p-4">
                                  <p><strong>Returned To:</strong> {rental.returnedToStallName}</p>
                                  <p><strong>End Time:</strong> {new Date(rental.endTime).toLocaleString()}</p>
                                  <p><strong>Duration:</strong> {rental.durationHours.toFixed(2)} hrs</p>
                                  <p><strong>Cost:</strong> HK${rental.finalCost.toFixed(2)}</p>
                                </div>
                                <h5 className="font-semibold px-4 pt-2">Diagnostic Log:</h5>
                                <ScrollArea className="h-40 border rounded-md m-2">
                                  <pre className="text-xs p-2 whitespace-pre-wrap font-mono">{JSON.stringify(rental.logs || [], null, 2)}</pre>
                                </ScrollArea>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                         <p className="text-sm text-muted-foreground">No rental history found for this user.</p>
                      )}
                  </div>

                </div>
              ) : null}
            </CardContent>
          </Card>
      </section>

       <section>
        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Clock className="mr-2 h-6 w-6 text-primary" /> Recent Activities</CardTitle>
              <CardDescription>A log of the last 10 rentals and returns.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAdminData ? (
               <div className="flex justify-center items-center h-24">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
               </div>
            ) : sortedActivityLog.length === 0 ? (
               <p className="text-muted-foreground text-center">No activities yet.</p>
            ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Stall</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedActivityLog.slice(0, 10).map((activity, index) => {
                       const time = activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'N/A';
                       return (
                           <TableRow key={index}>
                                <TableCell>
                                    <div className="font-medium">{activity.user.email || 'Unknown User'}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{activity.user.uid}</div>
                                </TableCell>
                                <TableCell>
                                    {activity.type === 'rent' ? (
                                        <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Rent</Badge>
                                    ) : (
                                        <Badge variant="secondary">Return</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{activity.stallName}</TableCell>
                                <TableCell>{time}</TableCell>
                           </TableRow>
                       );
                    })}
                  </TableBody>
                </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="text-2xl flex items-center"><Wrench className="mr-2 h-6 w-6 text-primary" /> Admin Actions</CardTitle>
              <CardDescription>Use these tools for administrative tasks like fixing user state.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-secondary/30">
              <Label htmlFor="reset-uid" className="font-semibold">Clear a User's Active Rental</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">If a user is stuck with an active rental due to an error, enter their User ID (UID) below and click clear. You can find the UID in the user management list.</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="reset-uid"
                  placeholder="Enter User ID (e.g., 9bRM...)"
                  value={uidToReset}
                  onChange={(e) => setUidToReset(e.target.value)}
                  disabled={isResettingUser}
                />
                <Button onClick={handleClearRental} disabled={isResettingUser || !uidToReset} variant="destructive">
                  {isResettingUser ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Eraser className="mr-2 h-4 w-4" />}
                  Clear Active Rental
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="text-2xl flex items-center"><PlusCircle className="mr-2 h-6 w-6 text-primary" /> {translate('admin_machine_reg_title')}</CardTitle><CardDescription>{translate('admin_machine_reg_desc')}</CardDescription></CardHeader>
          <form onSubmit={handleRegisterStall}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="stall-name">Stall Name</Label><Input id="stall-name" placeholder="e.g., TST Office" value={newStallName} onChange={(e) => setNewStallName(e.target.value)} disabled={isRegistering} /></div>
                <div className="space-y-1"><Label htmlFor="stall-dvid">Machine DVID (Serial #)</Label><Input id="stall-dvid" placeholder="e.g., CMYS234400559" value={newStallDvid} onChange={(e) => setNewStallDvid(e.target.value)} disabled={isRegistering} /></div>
                <div className="space-y-1"><Label htmlFor="stall-btname">Bluetooth Device Name</Label><Input id="stall-btname" placeholder="e.g., UDRY-MK001 or CDKJ" value={newStallBtName} onChange={(e) => setNewStallBtName(e.target.value)} disabled={isRegistering} /></div>
                <div className="space-y-1"><Label htmlFor="stall-address">Address</Label><Input id="stall-address" placeholder="e.g., 123 Nathan Road" value={newStallAddress} onChange={(e) => setNewStallAddress(e.target.value)} disabled={isRegistering} /></div>
                <div className="space-y-1"><Label htmlFor="stall-lat">Latitude</Label><Input id="stall-lat" type="number" step="any" placeholder="e.g., 22.3193" value={newStallLat} onChange={(e) => setNewStallLat(e.target.value)} disabled={isRegistering} /></div>
                <div className="space-y-1"><Label htmlFor="stall-lng">Longitude</Label><Input id="stall-lng" type="number" step="any" placeholder="e.g., 114.1694" value={newStallLng} onChange={(e) => setNewStallLng(e.target.value)} disabled={isRegistering} /></div>
                <div className="md:col-span-2 space-y-1"><Label htmlFor="stall-capacity">Total Umbrella Capacity</Label><Input id="stall-capacity" type="number" placeholder="e.g., 20" value={newStallCapacity} onChange={(e) => setNewStallCapacity(e.target.value)} disabled={isRegistering} /></div>
              </div>
            </CardContent>
            <CardFooter><Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isRegistering}>{isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />} Register Machine</Button></CardFooter>
          </form>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-2xl flex items-center"><ListTree className="mr-2 h-6 w-6 text-primary" /> {translate('admin_stall_management_title')}</CardTitle><CardDescription>{translate('admin_stall_management_desc')}</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            {stalls.length === 0 ? (
              <div className="p-6 bg-muted/50 rounded-md text-center"><p className="text-muted-foreground">No machines found. Register a new machine above.</p></div>
            ) : (
              stalls.map(stall => (
                <Card key={stall.dvid} className="bg-card">
                   {editingStallId === stall.dvid ? (
                     <>
                        <CardHeader><CardTitle className="text-lg flex items-center"><Edit className="mr-2 h-5 w-5" /> Editing: {stall.name}</CardTitle><CardDescription>Update the details for this machine.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-1"><Label htmlFor={`edit-name-${stall.dvid}`}>Stall Name</Label><Input id={`edit-name-${stall.dvid}`} value={editedStallName} onChange={e => setEditedStallName(e.target.value)} /></div>
                          <div className="space-y-1"><Label htmlFor={`edit-dvid-${stall.dvid}`}>Machine DVID</Label><Input id={`edit-dvid-${stall.dvid}`} value={editedStallDvid} onChange={e => setEditedStallDvid(e.target.value)} /></div>
                          <div className="space-y-1"><Label htmlFor={`edit-btname-${stall.dvid}`}>Bluetooth Device Name</Label><Input id={`edit-btname-${stall.dvid}`} value={editedBtName} onChange={e => setEditedBtName(e.target.value)} /></div>
                          <div className="space-y-1"><Label htmlFor={`edit-address-${stall.dvid}`}>Address</Label><Input id={`edit-address-${stall.dvid}`} value={editedStallAddress} onChange={e => setEditedStallAddress(e.target.value)} /></div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><Label htmlFor={`edit-lat-${stall.dvid}`}>Latitude</Label><Input id={`edit-lat-${stall.dvid}`} type="number" value={editedStallLat} onChange={e => setEditedStallLat(parseFloat(e.target.value) || 0)} step="any" /></div>
                            <div className="space-y-1"><Label htmlFor={`edit-lng-${stall.dvid}`}>Longitude</Label><Input id={`edit-lng-${stall.dvid}`} type="number" value={editedStallLng} onChange={e => setEditedStallLng(parseFloat(e.target.value) || 0)} step="any" /></div>
                          </div>
                           <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1"><Label htmlFor={`edit-action-slot-${stall.dvid}`}>Next Action Slot</Label><Input id={`edit-action-slot-${stall.dvid}`} type="number" value={editedNextActionSlot} onChange={e => setEditedNextActionSlot(parseInt(e.target.value, 10) || 1)} min="1" /></div>
                          </div>
                        </CardContent>
                        <CardFooter className="gap-2"><Button onClick={handleSaveStallDetails}><Save className="mr-2 h-4 w-4" /> Save</Button><Button variant="outline" onClick={() => setEditingStallId(null)}>Cancel</Button></CardFooter>
                     </>
                   ) : (
                     <>
                      <CardHeader><div className="flex justify-between items-start"><div><CardTitle className="text-lg">{stall.name}</CardTitle><CardDescription className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-1"><span className="flex items-center"><Hash className="mr-1 h-3 w-3" /> DVID: {stall.dvid}</span><span className="flex items-center"><Bluetooth className="mr-1 h-3 w-3" /> BT Name: {stall.btName || 'Not Set'}</span><span className="flex items-center"><Building className="mr-1 h-3 w-3" /> {stall.address}</span></CardDescription></div><Badge variant={stall.isDeployed ? 'default' : 'secondary'}>{stall.isDeployed ? 'Deployed' : 'Not Deployed'}</Badge></div></CardHeader>
                      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <p className="flex items-center"><ListTree className="mr-1 h-4 w-4" /> {translate('admin_stall_available_umbrellas_label')} <span className="font-semibold ml-1">{stall.availableUmbrellas} / {stall.totalUmbrellas}</span></p>
                        <p className="flex items-center"><Zap className="mr-2 h-4 w-4 text-purple-500"/> Next Action Slot: <span className="font-semibold ml-1">{stall.nextActionSlot}</span></p>
                      </CardContent>
                      <CardFooter className="gap-2 flex-wrap">
                        <Button variant={stall.isDeployed ? 'destructive' : 'default'} size="sm" onClick={() => handleToggleDeploy(stall)} disabled={togglingDeployId === stall.dvid}>{togglingDeployId === stall.dvid ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : stall.isDeployed ? <CloudOff className="mr-2 h-4 w-4" /> : <CloudUpload className="mr-2 h-4 w-4" />} {stall.isDeployed ? 'Un-deploy' : 'Deploy'}</Button>
                        <Button variant="outline" size="sm" onClick={() => { setEditingStallId(stall.dvid); setEditedStallName(stall.name); setEditedStallDvid(stall.dvid); setEditedBtName(stall.btName); setEditedStallAddress(stall.address); setEditedStallLat(stall.location?.latitude || 0); setEditedStallLng(stall.location?.longitude || 0); setEditedNextActionSlot(stall.nextActionSlot); }}>
                          <Edit className="mr-2 h-4 w-4" />{translate('admin_stall_edit_button')}
                        </Button>
                      </CardFooter>
                     </>
                   )}
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <div className="text-center mt-8">
        <Button asChild variant="outline"><Link href="/home" className="flex items-center"><Home className="mr-2 h-4 w-4" /> {translate('admin_go_to_homepage_button')}</Link></Button>
      </div>
    </div>
    </>
  );
}
