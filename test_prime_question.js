#!/usr/bin/env node
/**
 * Simple Prime IV chatbot question tester
 * Usage: node test_prime_question.js "your question here"
 */

const baseURL = 'http://localhost:3000';

async function askQuestion(question) {
  if (!question) {
    console.error('❌ Error: Please provide a question');
    console.log('\nUsage: node test_prime_question.js "your question here"');
    process.exit(1);
  }

  console.log('\n🏥 Prime IV Chatbot\n');
  console.log(`❓ Question: "${question}"\n`);
  console.log('⏳ Thinking...\n');

  try {
    const response = await fetch(`${baseURL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: question,
        businessId: 'primeiv',
        collectionName: 'primeiv',
        topK: 5
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log('─'.repeat(80));
    console.log('💬 ANSWER:');
    console.log('─'.repeat(80));
    console.log(data.answer);
    console.log('─'.repeat(80));
    
    console.log(`\n⏱️  Processing time: ${data.processingTime}ms`);
    console.log(`📚 Sources used: ${data.sources.length} chunks`);
    
    if (data.sources.length > 0) {
      console.log('\n📖 Top sources:');
      data.sources.slice(0, 3).forEach((source, idx) => {
        console.log(`   ${idx + 1}. ${source.source} (score: ${source.score.toFixed(4)})`);
      });
    }
    
    console.log(''); // Empty line at end

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Make sure the chatbot server is running:');
    console.log('   cd 4t-chatbot && npm run start:dev\n');
    process.exit(1);
  }
}

// Get question from command line argument
const question = process.argv.slice(2).join(' ');
askQuestion(question);
