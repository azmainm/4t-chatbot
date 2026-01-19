/**
 * Test script to demonstrate the RAG chatbot system
 * Run: node test-chatbot.js
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
  console.log('\n🚀 4T Chatbot RAG System - Demonstration\n');
  
  // Test 1: Health Check
  await testEndpoint(
    'Health Check',
    'GET',
    '/api/health'
  );
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Collection Stats
  await testEndpoint(
    'Collection Statistics',
    'GET',
    '/api/stats/4trades/4trades'
  );
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 3: Direct Retrieval
  await testEndpoint(
    'Direct Retrieval - "AI calling agent pricing"',
    'POST',
    '/api/retrieve',
    {
      query: 'How much does the AI calling agent cost?',
      businessId: '4trades',
      topK: 3,
      collectionName: '4trades'
    }
  );
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 4: Chat Endpoint - Pricing Question
  await testEndpoint(
    'Chat - Pricing Question',
    'POST',
    '/api/chat',
    {
      query: 'What are the pricing plans for the AI calling agent?',
      businessId: '4trades',
      topK: 5,
      collectionName: '4trades'
    }
  );
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 5: Chat Endpoint - FECA Question
  await testEndpoint(
    'Chat - FECA Question',
    'POST',
    '/api/chat',
    {
      query: 'What is FECA and what does it do?',
      businessId: '4trades',
      topK: 5,
      collectionName: '4trades'
    }
  );
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 6: Chat Endpoint - GROUNDWORK Question
  await testEndpoint(
    'Chat - GROUNDWORK Question',
    'POST',
    '/api/chat',
    {
      query: 'How long does the GROUNDWORK engagement take and what do I get?',
      businessId: '4trades',
      topK: 5,
      collectionName: '4trades'
    }
  );
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ All tests completed!');
  console.log(`${'='.repeat(80)}\n`);
}

main().catch(console.error);
