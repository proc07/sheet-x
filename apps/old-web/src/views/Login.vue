<template>
  <div class="w-full">
    <Card class="">
      <template #title>
        <div class="flex items-center justify-between">
          <span>登录 / 注册</span>
          <Tag value="JWT" />
        </div>
      </template>

      <template #content>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <InputText v-model="email" placeholder="you@example.com" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Password</label>
            <InputText v-model="password" type="password" placeholder=">= 6 位" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Name（注册可选）</label>
            <InputText v-model="name" placeholder="user name" class="w-full" />
          </div>

          <div class="flex gap-2">
            <Button label="登录" @click="doLogin" :loading="loading" />
            <Button label="注册" @click="doSignup" :loading="loading" />
          </div>

          <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const name = ref('');
const loading = ref(false);
const error = ref('');

async function doLogin() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(email.value, password.value);
    router.push('/');
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? '登录失败';
  } finally {
    loading.value = false;
  }
}

async function doSignup() {
  error.value = '';
  loading.value = true;
  try {
    await auth.signup(email.value, password.value, name.value || undefined);
    router.push('/');
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? '注册失败';
  } finally {
    loading.value = false;
  }
}
</script>
