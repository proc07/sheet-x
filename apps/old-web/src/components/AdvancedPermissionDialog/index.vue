<template>
  <Dialog
    v-model:visible="visibleProxy"
    modal
    :style="{ width: '92vw', maxWidth: '1200px', height: '86vh' }"
    :pt="{ content: { class: 'p-0! h-full' } }"
    :draggable="false"
  >
    <template #header>
      <div class="flex items-center gap-3 min-w-0">
        <span class="font-semibold shrink-0">高级权限</span>
        <div class="flex items-center gap-2 shrink-0">
          <InputSwitch v-model="enabled" />
          <span class="text-sm text-slate-500">启用</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <Checkbox v-model="allowShareGrant" binary />
          <span class="text-sm text-slate-500">允许通过分享授权</span>
        </div>
        <div class="flex-1"></div>
        <div class="text-xs text-slate-400 truncate max-w-[320px]">
          <span v-if="lastUpdatedAt">更新于 {{ formatTime(lastUpdatedAt) }}</span>
        </div>
      </div>
    </template>

    <div class="h-[calc(86vh-58px)] min-h-0 flex flex-col lg:flex-row relative">
      <div v-if="memberManageMode" class="absolute inset-0 z-20 bg-white flex flex-col">
        <div class="h-14 px-4 flex items-center justify-between border-b border-slate-200/80">
          <div class="flex items-center gap-2 min-w-0">
            <button
              type="button"
              class="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
              aria-label="返回"
              @click="closeMemberManage"
            >
              <i class="pi pi-angle-left text-slate-600"></i>
            </button>
            <div class="min-w-0">
              <div class="text-sm font-semibold text-slate-800 truncate">该角色包含的成员</div>
              <div class="text-xs text-slate-400 truncate">{{ selectedRole ? selectedRole.name : '' }}</div>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <InputText v-model="memberSearch" class="w-[min(380px,56vw)]" placeholder="搜索用户（姓名 / 邮箱）" />

            <div v-if="pendingAddUserIds.length" class="flex items-center gap-1">
              <div v-for="uid in pendingAddUserIds.slice(0, 6)" :key="uid" class="h-9 w-9 rounded-full overflow-hidden" :title="memberName(uid)">
                <Image
                  v-if="memberAvatarUrl(uid)"
                  :src="memberAvatarUrl(uid)"
                  alt="avatar"
                  preview
                  imageClass="h-9 w-9 object-cover"
                  :pt="{ button: { class: 'hidden' } }"
                />
                <div
                  v-else
                  class="h-9 w-9 rounded-full text-white text-xs font-semibold flex items-center justify-center"
                  :style="{ backgroundColor: avatarColor(uid) }"
                  @click="openAvatarDialog(uid)"
                >
                  {{ avatarText(uid) }}
                </div>
              </div>
              <div
                v-if="pendingAddUserIds.length > 6"
                class="h-9 w-9 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold flex items-center justify-center"
              >
                +{{ pendingAddUserIds.length - 6 }}
              </div>
            </div>

            <button
              type="button"
              class="h-9 w-9 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center"
              aria-label="添加到角色"
              :disabled="pendingAddUserIds.length === 0 || !selectedRole || selectedRole.type === ROLE_TYPE.SYSTEM"
              :class="pendingAddUserIds.length === 0 || !selectedRole || selectedRole.type === ROLE_TYPE.SYSTEM ? 'opacity-40 cursor-not-allowed' : ''"
              @click="applyPendingAdds"
            >
              <i class="pi pi-pencil text-slate-600"></i>
            </button>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-auto px-4 pb-6">
          <div v-if="memberSearch.trim()" class="pt-4">
            <div class="text-xs text-slate-400 mb-2">搜索结果</div>
            <div class="border border-slate-200/80 rounded-md overflow-hidden">
              <div
                v-for="u in filteredMemberCandidates"
                :key="u.userId"
                class="px-3 py-3 flex items-center gap-3 border-b border-slate-200/60 last:border-b-0"
              >
                <div class="h-10 w-10 rounded-full overflow-hidden shrink-0">
                  <Image
                    v-if="memberAvatarUrl(u.userId)"
                    :src="memberAvatarUrl(u.userId)"
                    alt="avatar"
                    preview
                    imageClass="h-10 w-10 object-cover"
                    :pt="{ button: { class: 'hidden' } }"
                  />
                  <div
                    v-else
                    class="h-10 w-10 rounded-full text-white text-sm font-semibold flex items-center justify-center"
                    :style="{ backgroundColor: avatarColor(u.userId) }"
                    @click="openAvatarDialog(u.userId)"
                  >
                    {{ avatarText(u.userId) }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-700 truncate">{{ u.name || u.email }}</div>
                  <div class="text-xs text-slate-400 truncate">{{ u.email }}</div>
                </div>
                <div class="shrink-0">
                  <Button
                    v-if="roleMemberIdSet.has(u.userId)"
                    label="已添加"
                    size="small"
                    severity="secondary"
                    outlined
                    disabled
                  />
                  <Button
                    v-else
                    :icon="pendingAddIdSet.has(u.userId) ? 'pi pi-check' : 'pi pi-plus'"
                    size="small"
                    rounded
                    :severity="pendingAddIdSet.has(u.userId) ? 'success' : 'secondary'"
                    @click="togglePendingAdd(u.userId)"
                    aria-label="选择用户"
                  />
                </div>
              </div>
              <div v-if="filteredMemberCandidates.length === 0" class="px-3 py-6 text-sm text-slate-400">没有匹配的用户</div>
            </div>
          </div>

          <div class="pt-6">
            <div class="text-xs text-slate-400">成员（{{ roleMemberIds.length }}）</div>
            <div class="mt-2 border border-slate-200/80 rounded-md overflow-hidden">
              <div v-if="roleMemberIds.length === 0" class="px-3 py-8 text-sm text-slate-400">暂无成员</div>
              <div
                v-for="uid in roleMemberIds"
                :key="uid"
                class="px-3 py-3 flex items-center gap-3 border-b border-slate-200/60 last:border-b-0"
              >
                <div class="h-10 w-10 rounded-full overflow-hidden shrink-0">
                  <Image
                    v-if="memberAvatarUrl(uid)"
                    :src="memberAvatarUrl(uid)"
                    alt="avatar"
                    preview
                    imageClass="h-10 w-10 object-cover"
                    :pt="{ button: { class: 'hidden' } }"
                  />
                  <div
                    v-else
                    class="h-10 w-10 rounded-full text-white text-sm font-semibold flex items-center justify-center"
                    :style="{ backgroundColor: avatarColor(uid) }"
                    @click="openAvatarDialog(uid)"
                  >
                    {{ avatarText(uid) }}
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-slate-700 truncate">{{ memberName(uid) }}</div>
                  <div class="text-xs text-slate-400 truncate">{{ memberEmail(uid) }}</div>
                </div>
                <div class="w-44 hidden md:block text-sm text-slate-400 truncate">-</div>
                <div class="shrink-0">
                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="secondary"
                    aria-label="移除成员"
                    :disabled="!selectedRole || selectedRole.type === ROLE_TYPE.SYSTEM"
                    @click="removeRoleMember(uid)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200/80 bg-slate-50/60 flex flex-col min-h-0">
        <div class="px-3 py-2 flex items-center justify-between">
          <span class="text-xs text-slate-500">系统角色</span>
          <Button size="small" icon="pi pi-plus" text @click="addRole" />
        </div>
        <div class="px-3 pb-2">
          <InputText v-model="roleSearch" placeholder="搜索角色" class="w-full" />
        </div>
        <div class="flex-1 min-h-0 overflow-auto">
          <div
            v-for="role in filteredRoles"
            :key="role.id"
            class="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-slate-100"
            :class="role.id === selectedRoleId ? 'bg-white' : ''"
            @click="selectedRoleId = role.id"
          >
            <i class="pi pi-user text-slate-400 text-xs"></i>
            <span class="truncate flex-1">{{ role.name }}</span>
            <Button
              v-if="role.type === ROLE_TYPE.CUSTOM"
              size="small"
              icon="pi pi-trash"
              text
              severity="danger"
              @click.stop="removeRole(role.id)"
            />
          </div>
        </div>
      </div>

      <div class="flex-1 min-w-0 min-h-0 flex flex-col">
        <div class="px-4 py-3 flex items-center justify-between border-b border-slate-200/80 bg-white">
          <div class="text-base font-semibold text-slate-800 truncate">
            {{ selectedRole ? selectedRole.name : '' }}
          </div>
          <Button
            v-if="selectedRole && selectedRole.type === ROLE_TYPE.CUSTOM"
            label="添加成员"
            icon="pi pi-plus"
            size="small"
            outlined
            @click="openMemberManage"
          />
        </div>
        <TabView class="h-full flex flex-col min-h-0">
          <TabPanel header="数据权限" value="data">
            <div class="h-full min-h-0 flex flex-col lg:flex-row">
              <div class="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200/80 flex flex-col min-h-0">
                <div class="p-3 pb-2">
                  <InputText v-model="tableSearch" placeholder="搜索数据表" class="w-full" />
                </div>
                <div class="flex-1 min-h-0 overflow-auto">
                  <div
                    v-for="t in filteredTables"
                    :key="t.id"
                    class="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center justify-between"
                    :class="t.id === selectedTableId ? 'bg-slate-50' : ''"
                    @click="selectedTableId = t.id"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <i class="pi pi-table text-slate-400 text-xs"></i>
                      <span class="truncate">{{ t.name }}</span>
                    </div>
                    <span class="text-xs text-slate-400">{{ tablePermissionLabel(getTablePerm(t.id).tablePermission) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex-1 min-w-0 min-h-0 overflow-auto p-4">
                <div v-if="!selectedRole || !selectedTable" class="text-sm text-slate-400">请选择角色与数据表</div>
                <div v-else class="flex flex-col gap-4">
                  <div class="flex flex-col gap-2 border border-slate-200/80 rounded-md p-3">
                    <div class="flex items-center justify-between gap-3">                      
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="font-medium truncate">数据表权限</span>
                      </div>
                      <div class="text-xs text-slate-400">权限预览：{{ previewText }}</div>
                    </div>
                      <div class="flex flex-wrap items-center gap-4">
                      <div class="flex items-center gap-2">
                        <RadioButton v-model="getTablePerm(selectedTable.id).tablePermission" inputId="perm_manage" value="MANAGE" :disabled="lockedSystemRole" />
                        <label for="perm_manage" class="text-sm text-slate-600">可管理</label>
                      </div>
                      <div class="flex items-center gap-2">
                        <RadioButton v-model="getTablePerm(selectedTable.id).tablePermission" inputId="perm_edit" value="EDIT" :disabled="lockedSystemRole" />
                        <label for="perm_edit" class="text-sm text-slate-600">可编辑</label>
                      </div>
                      <div class="flex items-center gap-2">
                        <RadioButton v-model="getTablePerm(selectedTable.id).tablePermission" inputId="perm_read" value="READ" :disabled="lockedSystemRole" />
                        <label for="perm_read" class="text-sm text-slate-600">仅可阅读</label>
                      </div>
                      <div class="flex items-center gap-2">
                        <RadioButton v-model="getTablePerm(selectedTable.id).tablePermission" inputId="perm_none" value="NONE" :disabled="lockedSystemRole" />
                        <label for="perm_none" class="text-sm text-slate-600">无权限</label>
                      </div>
                    </div>
                  </div>

                  <div class="border border-slate-200/80 rounded-md">
                    <div class="px-3 py-2 bg-slate-50 text-sm text-slate-600 font-medium">记录权限</div>
                    <div class="p-3 flex flex-col gap-3">
                      <div class="flex items-center gap-4">
                        <div class="flex items-center gap-2">
                          <Checkbox v-model="getTablePerm(selectedTable.id).record.canCreate" binary :disabled="lockedSystemRole || !canWriteTable" />
                          <span class="text-sm text-slate-600">可新增记录</span>
                        </div>
                        <div class="flex items-center gap-2">
                          <Checkbox v-model="getTablePerm(selectedTable.id).record.canDelete" binary :disabled="lockedSystemRole || !canWriteTable" />
                          <span class="text-sm text-slate-600">可删除记录</span>
                        </div>
                      </div>

                      <div class="text-sm text-slate-600 font-medium">可编辑的记录范围</div>
                      <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).record.editScope.type" inputId="edit_all" value="ALL" :disabled="lockedSystemRole || !canWriteTable" />
                          <label for="edit_all" class="text-sm text-slate-600">所有记录</label>
                        </div>
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).record.editScope.type" inputId="edit_created" value="CREATED_BY_ME" :disabled="lockedSystemRole || !canWriteTable" />
                          <label for="edit_created" class="text-sm text-slate-600">成员本人创建的记录</label>
                        </div>
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).record.editScope.type" inputId="edit_userfield" value="USER_FIELD_CONTAINS_ME" :disabled="lockedSystemRole || !canWriteTable" />
                          <label for="edit_userfield" class="text-sm text-slate-600">特定人员字段包含成员本人</label>
                        </div>
                        <div v-if="getTablePerm(selectedTable.id).record.editScope.type === 'USER_FIELD_CONTAINS_ME'" class="pl-6">
                          <Dropdown
                            class="w-full lg:w-80"
                            :options="userFieldsOfSelectedTable"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="选择人员字段"
                            v-model="getTablePerm(selectedTable.id).record.editScope.userFieldId"
                            :disabled="lockedSystemRole || !canWriteTable"
                          />
                        </div>
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).record.editScope.type" inputId="edit_condition" value="CONDITION" :disabled="lockedSystemRole || !canWriteTable" />
                          <label for="edit_condition" class="text-sm text-slate-600">满足特定条件的记录</label>
                        </div>
                        <div v-if="getTablePerm(selectedTable.id).record.editScope.type === 'CONDITION'" class="pl-6 flex flex-col gap-2">
                          <div
                            v-for="(c, idx) in getTablePerm(selectedTable.id).record.editScope.conditions"
                            :key="idx"
                            class="flex flex-col lg:flex-row items-start lg:items-center gap-2"
                          >
                            <Dropdown
                              class="w-full lg:w-56"
                              :options="selectedTable.fields"
                              optionLabel="name"
                              optionValue="id"
                              placeholder="字段"
                              v-model="c.fieldId"
                              :disabled="lockedSystemRole || !canWriteTable"
                            />
                            <Dropdown
                              class="w-full lg:w-40"
                              :options="conditionOps"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="运算符"
                              v-model="c.operator"
                              :disabled="lockedSystemRole || !canWriteTable"
                            />
                            <InputText class="w-full lg:w-56" v-model="c.value" placeholder="值" :disabled="lockedSystemRole || !canWriteTable" />
                            <Button icon="pi pi-times" text severity="secondary" @click="removeEditCondition(idx)" :disabled="lockedSystemRole || !canWriteTable" />
                          </div>
                          <div>
                            <Button size="small" label="添加条件" text icon="pi pi-plus" @click="addEditCondition" :disabled="lockedSystemRole || !canWriteTable" />
                          </div>
                        </div>
                      </div>

                      <div class="text-sm text-slate-600 font-medium">可阅读的记录范围</div>
                      <div class="flex flex-col gap-2">
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).record.readScope.type" inputId="read_all" value="ALL" :disabled="lockedSystemRole" />
                          <label for="read_all" class="text-sm text-slate-600">所有记录</label>
                        </div>
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).record.readScope.type" inputId="read_created" value="CREATED_BY_ME" :disabled="lockedSystemRole" />
                          <label for="read_created" class="text-sm text-slate-600">成员本人创建的记录</label>
                        </div>
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).record.readScope.type" inputId="read_userfield" value="USER_FIELD_CONTAINS_ME" :disabled="lockedSystemRole" />
                          <label for="read_userfield" class="text-sm text-slate-600">特定人员字段包含成员本人</label>
                        </div>
                        <div v-if="getTablePerm(selectedTable.id).record.readScope.type === 'USER_FIELD_CONTAINS_ME'" class="pl-6">
                          <Dropdown
                            class="w-full lg:w-80"
                            :options="userFieldsOfSelectedTable"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="选择人员字段"
                            v-model="getTablePerm(selectedTable.id).record.readScope.userFieldId"
                            :disabled="lockedSystemRole"
                          />
                        </div>
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).record.readScope.type" inputId="read_condition" value="CONDITION" :disabled="lockedSystemRole" />
                          <label for="read_condition" class="text-sm text-slate-600">满足特定条件的记录</label>
                        </div>
                        <div v-if="getTablePerm(selectedTable.id).record.readScope.type === 'CONDITION'" class="pl-6 flex flex-col gap-2">
                          <div
                            v-for="(c, idx) in getTablePerm(selectedTable.id).record.readScope.conditions"
                            :key="idx"
                            class="flex flex-col lg:flex-row items-start lg:items-center gap-2"
                          >
                            <Dropdown
                              class="w-full lg:w-56"
                              :options="selectedTable.fields"
                              optionLabel="name"
                              optionValue="id"
                              placeholder="字段"
                              v-model="c.fieldId"
                              :disabled="lockedSystemRole"
                            />
                            <Dropdown
                              class="w-full lg:w-40"
                              :options="conditionOps"
                              optionLabel="label"
                              optionValue="value"
                              placeholder="运算符"
                              v-model="c.operator"
                              :disabled="lockedSystemRole"
                            />
                            <InputText class="w-full lg:w-56" v-model="c.value" placeholder="值" :disabled="lockedSystemRole" />
                            <Button icon="pi pi-times" text severity="secondary" @click="removeReadCondition(idx)" :disabled="lockedSystemRole" />
                          </div>
                          <div>
                            <Button size="small" label="添加条件" text icon="pi pi-plus" @click="addReadCondition" :disabled="lockedSystemRole" />
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).record.readScope.type" inputId="read_same" value="SAME_AS_EDIT" :disabled="lockedSystemRole" />
                          <label for="read_same" class="text-sm text-slate-600">上述设置为可编辑的记录</label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="border border-slate-200/80 rounded-md">
                    <div class="px-3 py-2 bg-slate-50 text-sm text-slate-600 font-medium">字段权限</div>
                    <div class="p-3 flex flex-col gap-3">
                      <div class="flex flex-wrap items-center gap-6">
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).fields.mode" inputId="fields_all" :value="FIELD_MODE.ALL" :disabled="lockedSystemRole" />
                          <label for="fields_all" class="text-sm text-slate-600">所有字段均可编辑</label>
                        </div>
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).fields.mode" inputId="fields_custom" :value="FIELD_MODE.CUSTOM" :disabled="lockedSystemRole" />
                          <label for="fields_custom" class="text-sm text-slate-600">自定义权限</label>
                        </div>
                      </div>

                      <div v-if="getTablePerm(selectedTable.id).fields.mode === FIELD_MODE.CUSTOM" class="border border-slate-200/80 rounded-md overflow-hidden">
                        <DataTable :value="selectedTable.fields" scrollable scrollHeight="320px" size="small" :pt="{ header: { class: 'hidden' } }">
                          <Column field="name" header="字段">
                            <template #body="{ data }">
                              <div class="flex items-center gap-2 min-w-0">
                                <span class="truncate">{{ data.name }}</span>
                                <span class="text-xs text-slate-400">{{ data.type }}</span>
                              </div>
                            </template>
                          </Column>
                          <Column header="可阅读" style="width: 110px">
                            <template #body="{ data }">
                              <Checkbox v-model="fieldPerm(data.id).canRead" binary :disabled="lockedSystemRole" />
                            </template>
                          </Column>
                          <Column header="可新增" style="width: 110px">
                            <template #body="{ data }">
                              <Checkbox v-model="fieldPerm(data.id).canCreate" binary :disabled="lockedSystemRole || !canWriteTable" />
                            </template>
                          </Column>
                          <Column header="可编辑" style="width: 110px">
                            <template #body="{ data }">
                              <Checkbox v-model="fieldPerm(data.id).canEdit" binary :disabled="lockedSystemRole || !canWriteTable" />
                            </template>
                          </Column>
                        </DataTable>
                      </div>
                    </div>
                  </div>

                  <div class="border border-slate-200/80 rounded-md">
                    <div class="px-3 py-2 bg-slate-50 text-sm text-slate-600 font-medium">视图权限</div>
                    <div class="p-3 flex flex-col gap-3">
                      <div class="flex items-center gap-2">
                        <Checkbox
                          v-model="getTablePerm(selectedTable.id).views.canManage"
                          binary
                          :disabled="lockedSystemRole || getTablePerm(selectedTable.id).views.visible.mode === VIEW_VISIBLE_MODE.SPECIFIC || !canWriteTable"
                        />
                        <span class="text-sm text-slate-600">可新增、删除、修改视图</span>
                      </div>
                      <div class="flex flex-wrap items-center gap-6">
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).views.visible.mode" inputId="views_all" :value="VIEW_VISIBLE_MODE.ALL" :disabled="lockedSystemRole" />
                          <label for="views_all" class="text-sm text-slate-600">全部视图可见</label>
                        </div>
                        <div class="flex items-center gap-2">
                          <RadioButton v-model="getTablePerm(selectedTable.id).views.visible.mode" inputId="views_spec" :value="VIEW_VISIBLE_MODE.SPECIFIC" :disabled="lockedSystemRole" />
                          <label for="views_spec" class="text-sm text-slate-600">指定视图</label>
                        </div>
                      </div>
                      <div v-if="getTablePerm(selectedTable.id).views.visible.mode === VIEW_VISIBLE_MODE.SPECIFIC" class="pl-1">
                        <MultiSelect
                          class="w-full lg:w-[520px]"
                          :options="selectedTable.views"
                          optionLabel="name"
                          optionValue="id"
                          filter
                          placeholder="选择可见视图"
                          v-model="getTablePerm(selectedTable.id).views.visible.viewIds"
                          :disabled="lockedSystemRole"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="仪表盘权限" value="dashboard">
            <div class="p-4 flex flex-col gap-3">
              <div v-if="!selectedRole" class="text-sm text-slate-400">请选择角色</div>
              <div v-else class="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <span class="text-sm text-slate-600 w-20">权限</span>
                <div class="flex flex-wrap items-center gap-4">
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="selectedRole.dashboard.permission" inputId="dash_edit" value="EDIT" :disabled="lockedSystemRole" />
                    <label for="dash_edit" class="text-sm text-slate-600">可编辑</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="selectedRole.dashboard.permission" inputId="dash_read" value="READ" :disabled="lockedSystemRole" />
                    <label for="dash_read" class="text-sm text-slate-600">仅可阅读</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="selectedRole.dashboard.permission" inputId="dash_none" value="NONE" :disabled="lockedSystemRole" />
                    <label for="dash_none" class="text-sm text-slate-600">无权限</label>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="自动化权限" value="automation">
            <div class="p-4 flex flex-col gap-3">
              <div v-if="!selectedRole" class="text-sm text-slate-400">请选择角色</div>
              <div v-else class="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <span class="text-sm text-slate-600 w-20">权限</span>
                <div class="flex flex-wrap items-center gap-4">
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="selectedRole.automation.permission" inputId="auto_manage" value="MANAGE" :disabled="lockedSystemRole" />
                    <label for="auto_manage" class="text-sm text-slate-600">可管理</label>
                  </div>
                  <div class="flex items-center gap-2">
                    <RadioButton v-model="selectedRole.automation.permission" inputId="auto_none" value="NONE" :disabled="lockedSystemRole" />
                    <label for="auto_none" class="text-sm text-slate-600">无权限</label>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <TabPanel header="其他功能权限" value="other">
            <div class="p-4 flex flex-col gap-4">
              <div v-if="!selectedRole" class="text-sm text-slate-400">请选择角色</div>
              <div v-else class="flex flex-col gap-3">
                <div class="flex items-center gap-2">
                  <Checkbox v-model="selectedRole.other.allowCopy" binary :disabled="lockedSystemRole" />
                  <span class="text-sm text-slate-600">允许复制多维表格内容</span>
                </div>
                <div class="flex items-center gap-2">
                  <Checkbox v-model="selectedRole.other.allowDuplicate" binary :disabled="lockedSystemRole" />
                  <span class="text-sm text-slate-600">允许创建副本</span>
                </div>
                <div class="flex items-center gap-2">
                  <Checkbox v-model="selectedRole.other.allowDownload" binary :disabled="lockedSystemRole" />
                  <span class="text-sm text-slate-600">允许下载（导出）</span>
                </div>
                <div class="flex items-center gap-2">
                  <Checkbox v-model="selectedRole.other.allowPrint" binary :disabled="lockedSystemRole" />
                  <span class="text-sm text-slate-600">允许打印</span>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </div>

    <Dialog v-model:visible="avatarDialogVisible" modal :style="{ width: '360px' }" :draggable="false">
      <template #header>
        <div class="font-semibold">用户信息</div>
      </template>
      <div class="flex items-center gap-3">
        <div class="h-14 w-14 rounded-full overflow-hidden shrink-0">
          <Image
            v-if="avatarDialogUserId && memberAvatarUrl(avatarDialogUserId)"
            :src="memberAvatarUrl(avatarDialogUserId)"
            alt="avatar"
            preview
            imageClass="h-14 w-14 object-cover"
            :pt="{ button: { class: 'hidden' } }"
          />
          <div
            v-else
            class="h-14 w-14 rounded-full text-white text-lg font-semibold flex items-center justify-center"
            :style="{ backgroundColor: avatarDialogUserId ? avatarColor(avatarDialogUserId) : 'hsl(0 0% 60%)' }"
          >
            {{ avatarDialogUserId ? avatarText(avatarDialogUserId) : '?' }}
          </div>
        </div>
        <div class="min-w-0">
          <div class="text-sm font-medium text-slate-700 truncate">{{ avatarDialogUserId ? memberName(avatarDialogUserId) : '' }}</div>
          <div class="text-xs text-slate-400 truncate">{{ avatarDialogUserId ? memberEmail(avatarDialogUserId) : '' }}</div>
        </div>
      </div>
      <template #footer>
        <Button label="关闭" text severity="secondary" @click="avatarDialogVisible = false" />
      </template>
    </Dialog>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div class="text-xs text-slate-400">
          <span v-if="loading">加载中...</span>
        </div>
        <div class="flex items-center gap-2">
          <Button label="取消" text severity="secondary" @click="visibleProxy = false" />
          <Button label="保存" :loading="saving" @click="save" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { FIELD_TYPE_USER } from '../../constants/table';
import { TablePermission, TABLE_PERMISSION, FIELD_MODE, VIEW_VISIBLE_MODE, SCOPE_TYPE, Role, RoleTablePerm, ROLE_TYPE, ROLE_KEY } from '../../components/AdvancedPermissionDialog/types';
import { computed, nextTick, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { saveBaseAdvancedPermissions, loadBaseAdvancedPermissions } from '../../services/permission';
import deepClone from '../../utils/deepClone';

const props = defineProps<{
  baseId: string;
  visible: boolean;
  workspaceId: string;
}>();

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void;
}>();

const toast = useToast();

const visibleProxy = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

const loading = ref(false);
const saving = ref(false);
const enabled = ref(false);
const allowShareGrant = ref(true);
const roles = ref<Role[]>([]);
const members = ref<any[]>([]);
const tables = ref<any[]>([]);
const lastUpdatedAt = ref<string>('');

const selectedRoleId = ref('');
const selectedTableId = ref('');
const roleSearch = ref('');
const tableSearch = ref('');

const memberManageMode = ref(false);
const memberSearch = ref('');
const pendingAddUserIds = ref<string[]>([]);

const conditionOps = [
  { label: '等于', value: 'equals' },
  { label: '包含', value: 'contains' },
  { label: '为空', value: 'isEmpty' },
  { label: '不为空', value: 'isNotEmpty' },
];

// 为新角色设置默认的单表权限配置
function defaultRoleTablePerm(level: TablePermission): RoleTablePerm {
  return {
    tablePermission: level,
    record: {
      canCreate: level === TABLE_PERMISSION.MANAGE || level === TABLE_PERMISSION.EDIT,
      canDelete: level === TABLE_PERMISSION.MANAGE || level === TABLE_PERMISSION.EDIT,
      editScope: { type: SCOPE_TYPE.ALL, conditions: [] },
      readScope: { type: SCOPE_TYPE.ALL, conditions: [] },
    },
    fields: { mode: FIELD_MODE.ALL, permsByFieldId: {} },
    views: { canManage: level === TABLE_PERMISSION.MANAGE || level === TABLE_PERMISSION.EDIT, visible: { mode: VIEW_VISIBLE_MODE.ALL, viewIds: [] } },
  };
}

function randomId() {
  const anyCrypto = window.crypto;
  if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  return `role_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function newCustomRole(name = '自定义角色'): Role {
  return {
    id: randomId(),
    type: ROLE_TYPE.CUSTOM,
    name,
    memberUserIds: [],
    tables: { '*': defaultRoleTablePerm(TABLE_PERMISSION.READ) },
    dashboard: { permission: TABLE_PERMISSION.READ },
    automation: { permission: TABLE_PERMISSION.NONE },
    other: { allowCopy: true, allowDuplicate: true, allowDownload: true, allowPrint: true },
  };
}

// 把权限配置补齐/标准化
function normalizeRoleTablePerm(role: Role, tableId: string) {
  if (!role.tables) role.tables = { '*': defaultRoleTablePerm(TABLE_PERMISSION.READ) };
  if (!role.tables['*']) {
    const level =
      role.type === ROLE_TYPE.SYSTEM && (role.key === ROLE_KEY.OWNER || role.key === ROLE_KEY.ADMIN)
        ? TABLE_PERMISSION.MANAGE
        : role.type === ROLE_TYPE.SYSTEM && role.key === ROLE_KEY.VIEWER
          ? TABLE_PERMISSION.READ
          : TABLE_PERMISSION.EDIT;
    role.tables['*'] = defaultRoleTablePerm(level);
  }
  if (!role.tables[tableId]) role.tables[tableId] = deepClone(role.tables['*']);
  if (!role.tables[tableId].record.editScope.conditions) role.tables[tableId].record.editScope.conditions = [];
  if (!role.tables[tableId].record.readScope.conditions) role.tables[tableId].record.readScope.conditions = [];
  if (!role.tables[tableId].fields.permsByFieldId) role.tables[tableId].fields.permsByFieldId = {};
  if (!role.tables[tableId].views.visible.viewIds) role.tables[tableId].views.visible.viewIds = [];
  return role.tables[tableId];
}

const filteredRoles = computed(() => {
  const kw = roleSearch.value.trim().toLowerCase();
  if (!kw) return roles.value;
  return roles.value.filter((r) => r.name.toLowerCase().includes(kw));
});

const filteredTables = computed(() => {
  const kw = tableSearch.value.trim().toLowerCase();
  if (!kw) return tables.value;
  return tables.value.filter((t: any) => String(t.name ?? '').toLowerCase().includes(kw));
});

const selectedRole = computed(() => roles.value.find((r) => r.id === selectedRoleId.value) ?? null);
const selectedTable = computed(() => tables.value.find((t: any) => t.id === selectedTableId.value) ?? null);

const lockedSystemRole = computed(() => {
  if (!selectedRole.value) return false;
  return selectedRole.value.type === ROLE_TYPE.SYSTEM && (selectedRole.value.key === ROLE_KEY.OWNER || selectedRole.value.key === ROLE_KEY.ADMIN);
});

// Workspace 成员的角色是后端枚举 WorkspaceRole
function roleKeyToWorkspaceRole(key?: (typeof ROLE_KEY)[keyof typeof ROLE_KEY]) {
  if (key === ROLE_KEY.OWNER) return 'OWNER';
  if (key === ROLE_KEY.ADMIN) return 'ADMIN';
  if (key === ROLE_KEY.VIEWER) return 'VIEWER';
  if (key === ROLE_KEY.EDITOR) return 'EDITOR';

  return '';
}

const roleMemberIds = computed(() => {
  if (!selectedRole.value) return [];
  if (selectedRole.value.type === ROLE_TYPE.CUSTOM) return selectedRole.value.memberUserIds ?? [];
  console.log(selectedRole, 'selectedRole')
  const workspaceRole = roleKeyToWorkspaceRole(selectedRole.value.key);
  return members.value.filter((m) => m.role === workspaceRole).map((m) => m.userId);
});
const roleMemberIdSet = computed(() => new Set(roleMemberIds.value));
const pendingAddIdSet = computed(() => new Set(pendingAddUserIds.value));

const memberIndexById = computed(() => {
  const map: Record<string, { name: string; email: string; avatarUrl?: string }> = {};
  members.value.forEach((m) => {
    const userId = m.userId;
    if (!userId) return;
    map[userId] = { name: m.user?.name ?? '', email: m.user?.email ?? '', avatarUrl: m.user?.avatarUrl ?? undefined };
  });
  return map;
});

const filteredMemberCandidates = computed(() => {
  const q = memberSearch.value.trim().toLowerCase();
  if (!q) return [] as Array<{ userId: string; name: string; email: string }>;
  const list = members.value
    .map((m) => ({ userId: m.userId, name: m.user?.name ?? '', email: m.user?.email ?? '' }))
    .filter((u) => !!u.userId)
    .filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q))
    .slice(0, 20);
  return list as Array<{ userId: string; name: string; email: string }>;
});

const canWriteTable = computed(() => {
  const perm = selectedTableId.value ? getTablePerm(selectedTableId.value).tablePermission : TABLE_PERMISSION.READ;
  return perm === TABLE_PERMISSION.MANAGE || perm === TABLE_PERMISSION.EDIT;
});

// 仅筛选“人员字段”（FIELD_TYPE_USER），用于“人员字段包含我”的记录范围设置
const userFieldsOfSelectedTable = computed(() => {
  if (!selectedTable.value) return [];
  return (selectedTable.value.fields ?? []).filter((f: any) => f.type === FIELD_TYPE_USER);
});

const previewText = computed(() => {
  if (!selectedRole.value || !selectedTable.value) return '-';
  const p = getTablePerm(selectedTable.value.id);
  const canRead = p.tablePermission !== TABLE_PERMISSION.NONE;
  const canEdit = p.tablePermission === TABLE_PERMISSION.EDIT || p.tablePermission === TABLE_PERMISSION.MANAGE;
  return `${tablePermissionLabel(p.tablePermission)} / 记录:${canRead ? '可读' : '不可读'}${canEdit ? ', 可写' : ''}`;
});

// 获取角色在指定表上的权限配置
function getTablePerm(tableId: string) {
  const role = selectedRole.value;
  if (!role) return defaultRoleTablePerm(TABLE_PERMISSION.READ);
  return normalizeRoleTablePerm(role, tableId);
}

function fieldPerm(fieldId: string) {
  const role = selectedRole.value;
  const table = selectedTable.value;
  if (!role || !table) return { canRead: true, canCreate: true, canEdit: true };
  const perm = normalizeRoleTablePerm(role, table.id);
  if (!perm.fields.permsByFieldId[fieldId]) {
    perm.fields.permsByFieldId[fieldId] = { canRead: true, canCreate: true, canEdit: true };
  }
  return perm.fields.permsByFieldId[fieldId];
}

function tablePermissionLabel(level: TablePermission) {
  if (level === TABLE_PERMISSION.MANAGE) return '可管理';
  if (level === TABLE_PERMISSION.EDIT) return '可编辑';
  if (level === TABLE_PERMISSION.READ) return '仅可阅读';
  return '无权限';
}

function addEditCondition() {
  const p = selectedTable.value ? getTablePerm(selectedTable.value.id) : null;
  if (!p) return;
  p.record.editScope.conditions.push({ fieldId: '', operator: 'equals', value: '' });
}
function removeEditCondition(idx: number) {
  const p = selectedTable.value ? getTablePerm(selectedTable.value.id) : null;
  if (!p) return;
  p.record.editScope.conditions.splice(idx, 1);
}
function addReadCondition() {
  const p = selectedTable.value ? getTablePerm(selectedTable.value.id) : null;
  if (!p) return;
  p.record.readScope.conditions.push({ fieldId: '', operator: 'equals', value: '' });
}
function removeReadCondition(idx: number) {
  const p = selectedTable.value ? getTablePerm(selectedTable.value.id) : null;
  if (!p) return;
  p.record.readScope.conditions.splice(idx, 1);
}

function addRole() {
  roles.value.push(newCustomRole());
  nextTick(() => {
    selectedRoleId.value = roles.value[roles.value.length - 1]?.id ?? '';
  });
}

function removeRole(roleId: string) {
  roles.value = roles.value.filter((r) => r.id !== roleId);
  if (selectedRoleId.value === roleId) {
    selectedRoleId.value = roles.value[0]?.id ?? '';
  }
}

function openMemberManage() {
  if (!selectedRole.value || selectedRole.value.type === ROLE_TYPE.SYSTEM) return;
  memberManageMode.value = true;
  memberSearch.value = '';
  pendingAddUserIds.value = [];
}

function closeMemberManage() {
  memberManageMode.value = false;
  memberSearch.value = '';
  pendingAddUserIds.value = [];
}

function togglePendingAdd(userId: string) {
  if (pendingAddIdSet.value.has(userId)) {
    pendingAddUserIds.value = pendingAddUserIds.value.filter((id) => id !== userId);
    return;
  }
  pendingAddUserIds.value = [...pendingAddUserIds.value, userId];
}

function applyPendingAdds() {
  if (!selectedRole.value || selectedRole.value.type === ROLE_TYPE.SYSTEM) return;
  if (pendingAddUserIds.value.length === 0) return;
  const set = new Set(selectedRole.value.memberUserIds ?? []);
  pendingAddUserIds.value.forEach((id) => set.add(id));
  selectedRole.value.memberUserIds = Array.from(set);
  pendingAddUserIds.value = [];
  memberSearch.value = '';
}

function removeRoleMember(userId: string) {
  if (!selectedRole.value || selectedRole.value.type === ROLE_TYPE.SYSTEM) return;
  selectedRole.value.memberUserIds = (selectedRole.value.memberUserIds ?? []).filter((id) => id !== userId);
}

const avatarDialogVisible = ref(false);
const avatarDialogUserId = ref<string>('');

function openAvatarDialog(userId: string) {
  avatarDialogUserId.value = userId;
  avatarDialogVisible.value = true;
}

function memberName(userId: string) {
  const m = memberIndexById.value[userId];
  if (m?.name) return m.name;
  if (m?.email) return m.email;
  return userId;
}

function memberEmail(userId: string) {
  return memberIndexById.value[userId]?.email ?? '';
}

function memberAvatarUrl(userId: string) {
  return memberIndexById.value[userId]?.avatarUrl ?? '';
}

function avatarText(userId: string) {
  const label = memberName(userId).trim();
  if (!label) return '?';
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  const first = parts[0] ?? label;
  const ascii = /^[A-Za-z0-9]/.test(first);
  if (ascii) return first.slice(0, 2).toUpperCase();
  return first.slice(0, 2);
}

function avatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 70% 45%)`;
}

async function load() {
  if (!props.baseId) return;
  loading.value = true;
  try {
    const data = await loadBaseAdvancedPermissions(props.baseId);
    enabled.value = !!data.enabled;
    allowShareGrant.value = !!data.allowShareGrant;
    console.log(data.config?.roles, 'data.config?.roles')
    roles.value = deepClone((data.config?.roles ?? []) as Role[]);
    members.value = data.members ?? [];
    tables.value = data.tables ?? [];
    lastUpdatedAt.value = data.updatedAt ?? '';

    selectedRoleId.value = roles.value[0]?.id ?? '';
    selectedTableId.value = tables.value[0]?.id ?? '';
    closeMemberManage();
  } catch (e: any) {
    toast.add({ severity: 'error', summary: '加载失败', detail: e?.response?.data?.message ?? '加载失败' });
  } finally {
    loading.value = false;
  }
}

async function save() {
  if (!props.baseId) return;
  saving.value = true;
  try {
    const config = { version: 1, roles: roles.value };
    const data = await saveBaseAdvancedPermissions(props.baseId, {
      enabled: enabled.value,
      allowShareGrant: allowShareGrant.value,
      config,
    });
    lastUpdatedAt.value = data.updatedAt ?? '';
    toast.add({ severity: 'success', summary: '保存成功', life: 1000 });
  } catch (e: any) {
    toast.add({ severity: 'error', summary: '保存失败', detail: e?.response?.data?.message ?? '保存失败' });
  } finally {
    saving.value = false;
  }
}

function formatTime(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

watch(
  () => visibleProxy.value,
  async (v) => {
    if (!v) return;
    await load();
  }
);

watch(
  () => selectedRoleId.value,
  () => {
    if (!memberManageMode.value) return;
    memberSearch.value = '';
    pendingAddUserIds.value = [];
  }
);
</script>
