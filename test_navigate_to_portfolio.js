// Test script to check if navigate_to_portfolio column exists
// Run this in your browser console after logging in

// Check if the column exists by trying to select it
const testColumn = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('navigate_to_portfolio')
      .limit(1);
    
    if (error) {
      console.error('Column does not exist:', error);
      return false;
    }
    
    console.log('Column exists, sample data:', data);
    return true;
  } catch (err) {
    console.error('Error testing column:', err);
    return false;
  }
};

// Run the test
testColumn();
