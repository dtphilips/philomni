import { supabase } from './supabase'

/**
 * Add earnings to a user's wallet and insert a transaction record.
 * Safe to call concurrently — uses upsert on the wallet row.
 *
 * @param {string} userId
 * @param {number} amount        - positive value to add
 * @param {string} type          - 'earning' | 'course_sale' | 'product_sale' | 'consulting_fee' | 'ad_revenue' | 'bonus' | 'withdrawal' | 'refund'
 * @param {string} description
 * @param {string|null} referenceId - optional FK to the related row
 */
export async function addToWallet(userId, amount, type = 'earning', description = '', referenceId = null) {
  if (!userId || !amount) return

  // Upsert wallet row (increment balance + total_earned)
  const { data: existing } = await supabase
    .from('wallet')
    .select('balance, total_earned, total_withdrawn, pending_payout')
    .eq('user_id', userId)
    .single()

  if (existing) {
    const isWithdrawal = type === 'withdrawal'
    await supabase.from('wallet').update({
      balance:       isWithdrawal ? Math.max(0, existing.balance - amount)      : existing.balance + amount,
      total_earned:  isWithdrawal ? existing.total_earned                        : existing.total_earned + amount,
      total_withdrawn: isWithdrawal ? existing.total_withdrawn + amount          : existing.total_withdrawn,
      updated_at:    new Date().toISOString(),
    }).eq('user_id', userId)
  } else {
    await supabase.from('wallet').insert({
      user_id:     userId,
      balance:     type === 'withdrawal' ? 0 : amount,
      total_earned: type === 'withdrawal' ? 0 : amount,
    })
  }

  // Insert transaction record
  await supabase.from('wallet_transactions').insert({
    user_id:      userId,
    amount:       type === 'withdrawal' ? -Math.abs(amount) : Math.abs(amount),
    type,
    description,
    reference_id: referenceId,
  })
}

/**
 * Get wallet summary for a user.
 */
export async function getWallet(userId) {
  const { data } = await supabase
    .from('wallet')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data || { balance: 0, total_earned: 0, total_withdrawn: 0, pending_payout: 0 }
}
