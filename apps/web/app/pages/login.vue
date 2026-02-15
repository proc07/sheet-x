<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({ title: '登录 - Sheet-X' })

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) return
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    toast.add({ title: '登录成功', color: 'success' })
    router.push('/')
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || '登录失败，请检查邮箱和密码'
    toast.add({ title: '登录失败', description: msg, color: 'error' })
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
      <h1 class="text-2xl font-bold text-highlighted">登录 Sheet-X</h1>
      <p class="text-sm text-muted mt-1">请输入您的账号信息</p>
    </div>

    <!-- Form Card -->
    <UCard :ui="{ body: 'p-6 sm:p-8' }">
      <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
        <UFormField label="邮箱">
          <UInput
            class="w-full"
            v-model="email"
            type="email"
            placeholder="your@email.com"
            icon="i-lucide-mail"
            size="lg"
            autofocus
          />
        </UFormField>

        <UFormField label="密码">
          <UInput
            class="w-full"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码"
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

        <UButton
          type="submit"
          label="登 录"
          size="lg"
          block
          :loading="loading"
          :disabled="!email || !password"
          class="mt-2"
        />
      </form>
    </UCard>

    <!-- Register Link -->
    <p class="text-center text-sm text-muted">
      还没有账号？
      <NuxtLink to="/register" class="text-primary hover:underline font-medium">
        立即注册
      </NuxtLink>
    </p>
  </div>
</template>
