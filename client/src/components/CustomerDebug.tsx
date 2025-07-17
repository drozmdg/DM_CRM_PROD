import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function CustomerDebug() {
  const [directFetchData, setDirectFetchData] = useState(null);
  const [directFetchError, setDirectFetchError] = useState(null);

  // Direct fetch test
  useEffect(() => {
    fetch("/api/customers", { credentials: "include" })
      .then(res => {
        console.log("Direct fetch response:", res);
        return res.json();
      })
      .then(data => {
        console.log("Direct fetch data:", data);
        setDirectFetchData(data);
      })
      .catch(err => {
        console.error("Direct fetch error:", err);
        setDirectFetchError(err.message);
      });
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      console.log("React Query queryFn executing...");
      const response = await fetch("/api/customers", { credentials: "include" });
      console.log("React Query response:", response);
      if (!response.ok) throw new Error(`${response.status}: ${response.statusText}`);
      const data = await response.json();
      console.log("React Query data:", data);
      return data;
    },
  });

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold">Customer Debug Info:</h3>
      
      <div className="mt-2">
        <h4 className="font-semibold">Direct Fetch:</h4>
        <p>Data: {directFetchData ? JSON.stringify(directFetchData).substring(0, 100) + "..." : "None"}</p>
        <p>Error: {directFetchError || "None"}</p>
      </div>

      <div className="mt-2">
        <h4 className="font-semibold">React Query:</h4>
        <p>Loading: {isLoading ? "Yes" : "No"}</p>
        <p>Error: {error ? error.message : "None"}</p>
        <p>Data count: {data ? data.length : 0}</p>
      </div>
      
      {data && (
        <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
