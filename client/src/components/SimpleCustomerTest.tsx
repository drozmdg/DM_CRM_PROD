import { useState, useEffect } from "react";

export default function SimpleCustomerTest() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("SimpleCustomerTest: Starting fetch...");
    setLoading(true);
    
    fetch("/api/customers", { 
      credentials: "include",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        console.log("SimpleCustomerTest: Response received", response);
        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);
        console.log("Response headers:", Object.fromEntries(response.headers));
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("SimpleCustomerTest: Data received", data);
        console.log("Data type:", typeof data);
        console.log("Is array:", Array.isArray(data));
        setCustomers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("SimpleCustomerTest: Error", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
      <h3 className="font-bold text-yellow-800">Simple Customer Test (No React Query)</h3>
      <p>Loading: {loading ? "Yes" : "No"}</p>
      <p>Error: {error || "None"}</p>
      <p>Customers: {customers.length}</p>
      {customers.length > 0 && (
        <div className="mt-2">
          <h4 className="font-semibold">Customer Names:</h4>
          <ul className="list-disc list-inside">
            {customers.map((customer, index) => (
              <li key={index}>{customer.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
