<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({ title: '注册 - Sheet-X' })

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const showPassword = ref(false)

const passwordMismatch = computed(() =>
  confirmPassword.value.length > 0 && password.value !== confirmPassword.value
)

const canSubmit = computed(() =>
  email.value && password.value && password.value === confirmPassword.value
)

async function handleSignup() {
  if (!canSubmit.value) return
  loading.value = true
  try {
    await auth.signup(email.value, password.value, name.value || undefined)
    toast.add({ title: '注册成功', color: 'success' })
    router.push('/')
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || '注册失败，请稍后再试'
    toast.add({ title: '注册失败', description: msg, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Logo & Title -->
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
        <UIcon name="i-lucide-table" class="w-7 h-7 text-primary" />
      </div>
      <h1 class="text-2xl font-bold text-highlighted">注册 Sheet-X</h1>
      <p class="text-sm text-muted mt-1">创建您的账号</p>
    </div>

    <!-- Form Card -->
    <UCard :ui="{ body: 'p-6 sm:p-8' }">
      <form class="flex flex-col gap-4" @submit.prevent="handleSignup">
        <UFormField label="昵称（可选）">
          <UInput
            v-model="name"
            class="w-full"
            placeholder="您的昵称"
            icon="i-lucide-user"
            size="lg"
            autofocus
          />
        </UFormField>

        <UFormField label="邮箱">
          <UInput
            v-model="email"
            class="w-full"
            type="email"
            placeholder="your@email.com"
            icon="i-lucide-mail"
            size="lg"
          />
        </UFormField>

        <UFormField label="密码">
          <UInput
            v-model="password"
            class="w-full"
            :type="showPassword ? 'text' : 'password'"
            placeholder="至少 6 个字符"
            icon="i-lucide-lock"
            size="lg"
            :ui="{ trailing: 'pr-1' }"
          >
            <template #trailing>
              <UButton
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                size="xs"
                color="neutral"
                variant="ghost"
                :padded="false"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="确认密码" :error="passwordMismatch ? '两次密码输入不一致' : undefined">
          <UInput
            v-model="confirmPassword"
            :type="showPassword ? 'text' : 'password'"
            placeholder="再次输入密码"
            icon="i-lucide-lock"
            class="w-full"
            size="lg"
            :color="passwordMismatch ? 'error' : undefined"
          />
        </UFormField>

        <UButton
          type="submit"
          label="注 册"
          size="lg"
          block
          :loading="loading"
          :disabled="!canSubmit"
          class="mt-2"
        />
      </form>
    </UCard>

    <!-- Login Link -->
    <p class="text-center text-sm text-muted">
      已有账号？
      <NuxtLink to="/login" class="text-primary hover:underline font-medium">
        立即登录
      </NuxtLink>
    </p>
  </div>
</template>
