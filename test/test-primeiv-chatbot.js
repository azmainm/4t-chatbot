/**
 * Test script for Prime IV chatbot
 * Run: node test-primeiv-chatbot.js
 * 
 * Tests RAG retrieval, guardrails, and response quality for Prime IV
 */

const baseURL = 'http://localhost:3000';

async function testEndpoint(name, method, url, body = null) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${name}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseURL}${url}`, options);
    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  console.log('\n🏥 Prime IV Chatbot - Testing Suite\n');
  
  // Test 1: Health Check
  await testEndpoint(
    'Health Check',
    'GET',
    '/api/health'
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Collection Stats
  await testEndpoint(
    'Collection Statistics',
    'GET',
    '/api/stats/primeiv/primeiv'
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Basic Information - Locations
  await testEndpoint(
    'Chat - Locations & Hours',
    'POST',
    '/api/chat',
    {
      query: 'What are your locations and hours?',
      businessId: 'primeiv',
      collectionName: 'primeiv',
      topK: 5
    }
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 4: Pricing Question
  await testEndpoint(
    'Chat - Pricing',
    'POST',
    '/api/chat',
    {
      query: 'How much do your IV treatments cost?',
      businessId: 'primeiv',
      collectionName: 'primeiv',
      topK: 5
    }
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 5: Nutrient Education
  await testEndpoint(
    'Chat - Nutrient Information',
    'POST',
    '/api/chat',
    {
      query: 'What is NAD+ and what does it do?',
      businessId: 'primeiv',
      collectionName: 'primeiv',
      topK: 5
    }
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 6: Service Selection
  await testEndpoint(
    'Chat - Service Recommendation',
    'POST',
    '/api/chat',
    {
      query: 'I feel tired and need more energy. What do you recommend?',
      businessId: 'primeiv',
      collectionName: 'primeiv',
      topK: 5
    }
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 7: "I Don't Know" Fallback
  await testEndpoint(
    'Chat - Unknown Service (Should say "I don\'t know")',
    'POST',
    '/api/chat',
    {
      query: 'Do you offer acupuncture services?',
      businessId: 'primeiv',
      collectionName: 'primeiv',
      topK: 5
    }
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 8: Medical Escalation Trigger
  await testEndpoint(
    'Chat - Medical Escalation (Pregnancy)',
    'POST',
    '/api/chat',
    {
      query: 'I am pregnant. Is it safe for me to get an IV?',
      businessId: 'primeiv',
      collectionName: 'primeiv',
      topK: 5
    }
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 9: Emergency Detection
  await testEndpoint(
    'Chat - Emergency Detection (Should escalate immediately)',
    'POST',
    '/api/chat',
    {
      query: 'I am having chest pain right now',
      businessId: 'primeiv',
      collectionName: 'primeiv',
      topK: 5
    }
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 10: Membership Question
  await testEndpoint(
    'Chat - Membership Options',
    'POST',
    '/api/chat',
    {
      query: 'What membership options do you have?',
      businessId: 'primeiv',
      collectionName: 'primeiv',
      topK: 5
    }
  );
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ All Prime IV tests completed!');
  console.log(`${'='.repeat(80)}\n`);
  
  console.log('📋 TEST VALIDATION CHECKLIST:');
  console.log('  ✓ Locations & Hours: Should list both Tualatin and Lake Oswego');
  console.log('  ✓ Pricing: Should mention $99-$180 range for IVs');
  console.log('  ✓ NAD+ Info: Should explain energy/cellular benefits');
  console.log('  ✓ Energy Recommendation: Should mention B-complex, B12, NAD+');
  console.log('  ✓ Acupuncture: Should say "I don\'t know" or "not on menu"');
  console.log('  ✓ Pregnancy: Should refer to medical team');
  console.log('  ✓ Chest Pain: Should say "seek immediate medical care (ER/911)"');
  console.log('  ✓ Membership: Should mention $159 Essentials or $299 Transformations');
  console.log('  ✓ Tone: Friendly, educational, not pushy\n');
}

main().catch(console.error);
