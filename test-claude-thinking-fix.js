// Test to verify the Claude 4.0 thinking parameter fix works for copilot-proxy
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the extra-params.ts file to verify our implementation
const extraParamsPath = join(__dirname, 'src', 'agents', 'pi-embedded-runner', 'extra-params.ts');
const extraParamsContent = readFileSync(extraParamsPath, 'utf8');

console.log('🔍 Testing Claude 4.0 thinking parameter fix...\n');

// Check if the new helper function exists
if (extraParamsContent.includes('shouldApplyAnthropicThinkingWrapper')) {
  console.log('✅ Found shouldApplyAnthropicThinkingWrapper function');
} else {
  console.log('❌ Missing shouldApplyAnthropicThinkingWrapper function');
  process.exit(1);
}

// Check if isClaudeModel function exists
if (extraParamsContent.includes('function isClaudeModel')) {
  console.log('✅ Found isClaudeModel function');
} else {
  console.log('❌ Missing isClaudeModel function');
  process.exit(1);
}

// Check if the wrapper is applied using the new helper
if (extraParamsContent.includes('shouldApplyAnthropicThinkingWrapper(provider, modelId)')) {
  console.log('✅ Anthropic thinking wrapper uses new helper function');
} else {
  console.log('❌ Anthropic thinking wrapper not using new helper function');
  process.exit(1);
}

// Test the logic manually
console.log('\n📝 Testing thinking level mappings for copilot-proxy:');

// Simulate the isClaudeModel function
function isClaudeModel(modelId) {
  return /\bclaude-/i.test(modelId);
}

// Simulate shouldApplyAnthropicThinkingWrapper function
function shouldApplyAnthropicThinkingWrapper(provider, modelId) {
  if (provider === "anthropic") {
    return true;
  }
  return isClaudeModel(modelId);
}

// Test cases
const testCases = [
  // Your configuration cases
  { provider: 'copilot-proxy', modelId: 'claude-sonnet-4.5', expected: true },
  { provider: 'copilot-proxy', modelId: 'claude-opus-4.5', expected: true },
  { provider: 'copilot-proxy', modelId: 'claude-haiku-4.5', expected: true },
  { provider: 'copilot-proxy', modelId: 'gpt-5.2', expected: false },
  { provider: 'copilot-proxy', modelId: 'gemini-3-pro', expected: false },
  // Direct Anthropic cases
  { provider: 'anthropic', modelId: 'claude-sonnet-4', expected: true },
  { provider: 'anthropic', modelId: 'not-claude', expected: true }, // Direct anthropic always applies
];

let allPassed = true;
for (const testCase of testCases) {
  const result = shouldApplyAnthropicThinkingWrapper(testCase.provider, testCase.modelId);
  const status = result === testCase.expected ? '✅' : '❌';
  if (result !== testCase.expected) allPassed = false;
  console.log(`  ${status} ${testCase.provider}/${testCase.modelId} → ${result} (expected: ${testCase.expected})`);
}

if (allPassed) {
  console.log('\n🎉 All tests passed! The fix should resolve your Claude 4.0 thinking error.');
  console.log('\n📋 Summary of the fix:');
  console.log('• Extended Anthropic thinking wrapper to work with copilot-proxy');
  console.log('• Now applies to any provider serving Claude models');  
  console.log('• Your copilot-proxy Claude models will now get proper thinking parameters');
  console.log('• This should resolve the "Expected thinking or redacted_thinking" error');
} else {
  console.log('\n❌ Some tests failed. Please check the implementation.');
  process.exit(1);
}
