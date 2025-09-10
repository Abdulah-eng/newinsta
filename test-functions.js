// Test script to check if Supabase Edge Functions are accessible
// Run this in the browser console to test the functions

const SUPABASE_URL = "https://khmytjiytpgpkccwncvj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobXl0aml5dHBncGtjY3duY3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMTUxOTMsImV4cCI6MjA3MjU5MTE5M30.Mtat_70w7LW-jHsuVicCsywVxU49kgQ0t15fXPq2Wxs";

async function testEdgeFunction(functionName) {
  try {
    console.log(`Testing ${functionName}...`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`${functionName} response:`, response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`${functionName} data:`, data);
    } else {
      const error = await response.text();
      console.error(`${functionName} error:`, error);
    }
  } catch (error) {
    console.error(`${functionName} failed:`, error);
  }
}

// Test all functions
async function testAllFunctions() {
  console.log('Testing Supabase Edge Functions...');
  await testEdgeFunction('create-checkout');
  await testEdgeFunction('check-subscription');
  await testEdgeFunction('customer-portal');
}

// Run the tests
testAllFunctions();

