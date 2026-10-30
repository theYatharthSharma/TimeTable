
import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Check,
  X,
  Loader2,
  Search,
  UserCog,
  AlertCircle,
  Plus,
  Eye,
  EyeOff,
  UserX,
  RotateCcw,
  Trash2,
} from 'lucide-react';

import {
  getFeatures,
  getUserPermissions,
  grantPermission,
  revokePermission,
  type Feature,
  type PermissionGrant,
} from '../services/permissionService';

import {
  getPrincipals,
  getSchools,
  createPrincipal,
  deactivatePrincipal,
  reactivatePrincipal,
  deletePrincipal,
  type Principal,
  type School,
} from '../services/adminService';

interface PermissionState {
  [featureCode: string]: boolean;
}

interface PrincipalForm {
  full_name: string;
  email: string;
  password: string;
  school_id: string;
}

const emptyPrincipalForm: PrincipalForm = {
  full_name: '',
  email: '',
  password: '',
  school_id: '',
};

const PermissionsPage: React.FC = () => {
  const [principals, setPrincipals] = useState<Principal[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedPrincipal, setSelectedPrincipal] =
    useState<Principal | null>(null);
  const [permissions, setPermissions] = useState<PermissionGrant[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [processingFeature, setProcessingFeature] = useState<string | null>(
    null
  );
  const [processingPrincipal, setProcessingPrincipal] = useState<string | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showPrincipalModal, setShowPrincipalModal] = useState(false);
  const [principalForm, setPrincipalForm] =
    useState<PrincipalForm>(emptyPrincipalForm);
  const [creatingPrincipal, setCreatingPrincipal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    void loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [principalData, featureData, schoolData] = await Promise.all([
        getPrincipals(),
        getFeatures(),
        getSchools(),
      ]);

      setPrincipals(principalData);
      setFeatures(featureData);
      setSchools(schoolData);

      const firstActivePrincipal = principalData.find(
        (principal) => principal.is_active
      );

      setSelectedPrincipal(firstActivePrincipal ?? null);
    } catch (err) {
      console.error('Failed to load permission data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load permission management data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedPrincipal || !selectedPrincipal.is_active) {
      setPermissions([]);
      return;
    }

    void loadPrincipalPermissions(selectedPrincipal.id);
  }, [selectedPrincipal]);

  const loadPrincipalPermissions = async (principalId: string) => {
    try {
      setPermissionsLoading(true);
      setError(null);

      const data = await getUserPermissions(principalId);
      setPermissions(data);
    } catch (err) {
      console.error('Failed to load permissions:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load user permissions.'
      );
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const permissionMap = useMemo<PermissionState>(() => {
    const map: PermissionState = {};

    permissions.forEach((permission) => {
      if (permission.is_active) {
        map[permission.feature_code] = true;
      }
    });

    return map;
  }, [permissions]);

  const filteredPrincipals = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return principals;

    return principals.filter(
      (principal) =>
        principal.full_name.toLowerCase().includes(query) ||
        principal.email.toLowerCase().includes(query)
    );
  }, [principals, searchTerm]);

  const groupedFeatures = useMemo(() => {
    return features.reduce<Record<string, Feature[]>>((groups, feature) => {
      const category = feature.category || 'Other';

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(feature);
      return groups;
    }, {});
  }, [features]);

  const getGrantForFeature = (
    featureCode: string
  ): PermissionGrant | undefined => {
    return permissions.find(
      (permission) =>
        permission.feature_code === featureCode && permission.is_active
    );
  };

  const handlePermissionToggle = async (feature: Feature) => {
    if (!selectedPrincipal || !selectedPrincipal.is_active) {
      setError('Select an active principal to manage permissions.');
      return;
    }

    const currentlyGranted = permissionMap[feature.code] === true;

    try {
      setProcessingFeature(feature.code);
      setError(null);
      setSuccessMessage(null);

      if (currentlyGranted) {
        const grant = getGrantForFeature(feature.code);

        if (!grant) {
          throw new Error('Permission grant could not be found.');
        }

        await revokePermission(grant.id);

        setPermissions((previous) =>
          previous.map((permission) =>
            permission.id === grant.id
              ? {
                  ...permission,
                  is_active: false,
                  revoked_at: new Date().toISOString(),
                }
              : permission
          )
        );

        setSuccessMessage(
          `${feature.name} access revoked from ${selectedPrincipal.full_name}.`
        );
      } else {
        const newGrant = await grantPermission(
          selectedPrincipal.id,
          feature.code
        );

        setPermissions((previous) => [
          ...previous.filter(
            (permission) =>
              !(
                permission.feature_code === feature.code &&
                permission.is_active
              )
          ),
          newGrant,
        ]);

        setSuccessMessage(
          `${feature.name} access granted to ${selectedPrincipal.full_name}.`
        );
      }
    } catch (err) {
      console.error('Permission update failed:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to update permission.'
      );
    } finally {
      setProcessingFeature(null);
    }
  };

  const handleCreatePrincipal = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const fullName = principalForm.full_name.trim();
    const email = principalForm.email.trim();
    const password = principalForm.password;
    const schoolId = principalForm.school_id;

    if (!fullName) {
      setError('Please enter the principal name.');
      return;
    }

    if (!email) {
      setError('Please enter the principal email.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (!schoolId) {
      setError('Please select a school.');
      return;
    }

    try {
      setCreatingPrincipal(true);

      const newPrincipal = await createPrincipal({
        full_name: fullName,
        email,
        password,
        school_id: schoolId,
      });

      setPrincipals((previous) => [...previous, newPrincipal]);
      setSelectedPrincipal(newPrincipal);
      setPrincipalForm(emptyPrincipalForm);
      setShowPrincipalModal(false);
      setShowPassword(false);

      setSuccessMessage(
        `${newPrincipal.full_name} was created successfully.`
      );
    } catch (err) {
      console.error('Failed to create principal:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create principal.'
      );
    } finally {
      setCreatingPrincipal(false);
    }
  };

  const handleDeactivatePrincipal = async (principal: Principal) => {
    if (!principal.is_active) {
      setError('This principal is already inactive.');
      return;
    }

    const confirmed = window.confirm(
      `Deactivate ${principal.full_name} (${principal.email})?\n\n` +
        'This disables the account if the backend enforces inactive status. ' +
        'The principal record will remain in the database.'
    );

    if (!confirmed) return;

    try {
      setProcessingPrincipal(principal.id);
      setError(null);
      setSuccessMessage(null);

      await deactivatePrincipal(principal.id);

      const updatedPrincipal = {
        ...principal,
        is_active: false,
      };

      setPrincipals((previous) =>
        previous.map((item) =>
          item.id === principal.id ? updatedPrincipal : item
        )
      );

      if (selectedPrincipal?.id === principal.id) {
        setSelectedPrincipal(updatedPrincipal);
        setPermissions([]);
      }

      setSuccessMessage(
        `${principal.full_name} was deactivated successfully.`
      );
    } catch (err) {
      console.error('Failed to deactivate principal:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to deactivate principal.'
      );
    } finally {
      setProcessingPrincipal(null);
    }
  };

  
const handleReactivatePrincipal = async (principal: Principal) => {
  if (principal.is_active) return;

  if (!window.confirm(`Reactivate ${principal.full_name}?`)) return;

  try {
    setProcessingPrincipal(principal.id);
    setError(null);
    setSuccessMessage(null);

    await reactivatePrincipal(principal.id);

    const updated = { ...principal, is_active: true };

    setPrincipals((previous) =>
      previous.map((item) => item.id === principal.id ? updated : item)
    );

    if (selectedPrincipal?.id === principal.id) {
      setSelectedPrincipal(updated);
    }

    setSuccessMessage(`${principal.full_name} was reactivated.`);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to reactivate principal.');
  } finally {
    setProcessingPrincipal(null);
  }
};

const handleDeletePrincipal = async (principal: Principal) => {
  const confirmed = window.confirm(
    `PERMANENTLY DELETE ${principal.full_name} (${principal.email})?\n\n` +
    'This cannot be undone. Delete only if you are sure the account and its related records can be removed safely.'
  );

  if (!confirmed) return;

  try {
    setProcessingPrincipal(principal.id);
    setError(null);
    setSuccessMessage(null);

    await deletePrincipal(principal.id);

    setPrincipals((previous) =>
      previous.filter((item) => item.id !== principal.id)
    );

    if (selectedPrincipal?.id === principal.id) {
      setSelectedPrincipal(null);
      setPermissions([]);
    }

    setSuccessMessage(`${principal.full_name} was permanently deleted.`);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Failed to delete principal. The account may have linked records.'
    );
  } finally {
    setProcessingPrincipal(null);
  }
};

  const handleRefresh = async () => {
    try {
      setError(null);
      setSuccessMessage(null);

      const [principalData, schoolData] = await Promise.all([
        getPrincipals(),
        getSchools(),
      ]);

      setPrincipals(principalData);
      setSchools(schoolData);

      const previousSelectedId = selectedPrincipal?.id;
      const refreshedSelection = principalData.find(
        (principal) => principal.id === previousSelectedId
      );

      if (refreshedSelection) {
        setSelectedPrincipal(refreshedSelection);
      } else {
        const firstActive = principalData.find(
          (principal) => principal.is_active
        );
        setSelectedPrincipal(firstActive ?? null);
      }

      setSuccessMessage('Principal list refreshed.');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to refresh principals.'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading permission management...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3">
            <Shield className="h-7 w-7 text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Manage Access
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage principals and control their feature access.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setSuccessMessage(null);
              setShowPrincipalModal(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Principal
          </button>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={permissionsLoading || processingPrincipal !== null}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">Something went wrong</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>

          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700"
        >
          <Check className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>

          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccessMessage(null)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Teacher account management — UI prepared for the next backend phase */}
      <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5">
              <UserCog className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Teacher Accounts</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-600">
                Create and manage teacher sign-in accounts linked to existing teacher profiles. Account creation and password resets will be enabled after the Admin backend endpoint is added.
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            Backend integration pending
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-sm font-medium text-gray-800">Create teacher login</p>
            <p className="mt-1 text-xs text-gray-500">Link an account to a teacher profile and school.</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-sm font-medium text-gray-800">Manage account status</p>
            <p className="mt-1 text-xs text-gray-500">Review and activate or deactivate eligible accounts.</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-white p-3">
            <p className="text-sm font-medium text-gray-800">Password reset</p>
            <p className="mt-1 text-xs text-gray-500">Use a secure reset flow; existing passwords are never displayed.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-600">
          No teacher accounts are fabricated here. This section will use real teacher profiles and authenticated API responses once the backend endpoint is implemented.
        </p>
      </section>

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Principals list */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <UserCog className="h-5 w-5 text-gray-600" />
              <h2 className="font-semibold text-gray-900">Principals</h2>

              <span className="ml-auto rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {principals.length}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="search"
                placeholder="Search principals..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="max-h-[650px] space-y-2 overflow-y-auto p-3">
            {filteredPrincipals.length === 0 ? (
              <div className="p-6 text-center">
                <UserCog className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 font-medium text-gray-700">
                  No principals found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Add a principal or try a different search.
                </p>
              </div>
            ) : (
              filteredPrincipals.map((principal) => {
                const isSelected = selectedPrincipal?.id === principal.id;
                const isProcessing = processingPrincipal === principal.id;

                return (
                  <div
                    key={principal.id}
                    className={`rounded-lg border p-3 transition ${
                      isSelected
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPrincipal(principal);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="flex w-full min-w-0 items-center gap-3 text-left"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold ${
                          principal.is_active
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {principal.full_name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-gray-900">
                          {principal.full_name}
                        </p>

                        <p className="truncate text-xs text-gray-500">
                          {principal.email}
                        </p>

                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            principal.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {principal.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {isSelected && (
                        <Check className="h-5 w-5 shrink-0 text-blue-600" />
                      )}
                    </button>

                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                      <span className="block truncate text-xs text-gray-400">
                        {schools.find(
                          (school) => school.id === principal.school_id
                        )?.name ?? 'School not found'}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        {principal.is_active ? (
                          <button
                            type="button"
                            onClick={() => void handleDeactivatePrincipal(principal)}
                            disabled={isProcessing || processingPrincipal !== null}
                            className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <UserX className="h-3.5 w-3.5" />
                            )}
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleReactivatePrincipal(principal)}
                            disabled={isProcessing || processingPrincipal !== null}
                            className="inline-flex items-center gap-1.5 rounded-md border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            Reactivate
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleDeletePrincipal(principal)}
                          disabled={isProcessing || processingPrincipal !== null}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Feature permissions */}
        <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            {selectedPrincipal ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedPrincipal.full_name}
                  </h2>

                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      selectedPrincipal.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {selectedPrincipal.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedPrincipal.email}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {schools.find(
                    (school) => school.id === selectedPrincipal.school_id
                  )?.name ?? 'School not found'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900">
                  Feature Permissions
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select an active principal to manage their access.
                </p>
              </>
            )}
          </div>

          {!selectedPrincipal ? (
            <div className="flex min-h-[350px] items-center justify-center p-6 text-center">
              <div>
                <Shield className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 font-medium text-gray-700">
                  Select a principal
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a principal from the list to manage feature access.
                </p>
              </div>
            </div>
          ) : !selectedPrincipal.is_active ? (
            <div className="p-8 text-center">
              <UserX className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 font-medium text-gray-700">
                This principal is inactive
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Feature permissions cannot be changed while the account is
                inactive.
              </p>
            </div>
          ) : permissionsLoading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading permissions...</span>
              </div>
            </div>
          ) : features.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 font-medium text-gray-700">
                No features available
              </p>
              <p className="mt-1 text-sm text-gray-500">
                No features were returned by the backend.
              </p>
            </div>
          ) : (
            <div className="space-y-6 p-5">
              {Object.entries(groupedFeatures).map(
                ([category, categoryFeatures]) => (
                  <div key={category}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
                      {category}
                    </h3>

                    <div className="space-y-3">
                      {categoryFeatures.map((feature) => {
                        const enabled = permissionMap[feature.code] === true;
                        const processing = processingFeature === feature.code;

                        return (
                          <div
                            key={feature.code}
                            className={`flex flex-col gap-4 rounded-xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                              enabled
                                ? 'border-green-200 bg-green-50/50'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="min-w-0 sm:pr-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-medium text-gray-900">
                                  {feature.name}
                                </h4>

                                {enabled && (
                                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                    Enabled
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-sm text-gray-500">
                                {feature.description ||
                                  'No description available.'}
                              </p>

                              <p className="mt-2 break-all font-mono text-xs text-gray-400">
                                {feature.code}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                void handlePermissionToggle(feature)
                              }
                              disabled={
                                processing ||
                                processingFeature !== null ||
                                processingPrincipal !== null
                              }
                              className={`flex min-w-[110px] shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                enabled
                                  ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : enabled ? (
                                <>
                                  <X className="h-4 w-4" />
                                  Revoke
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4" />
                                  Grant
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* Add Principal modal */}
      {showPrincipalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Add Principal
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create a login account for a school principal.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close modal"
                disabled={creatingPrincipal}
                onClick={() => setShowPrincipalModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePrincipal} className="space-y-5 p-5">
              <div>
                <label
                  htmlFor="principal-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>

                <input
                  id="principal-name"
                  type="text"
                  required
                  maxLength={200}
                  value={principalForm.full_name}
                  onChange={(event) =>
                    setPrincipalForm((previous) => ({
                      ...previous,
                      full_name: event.target.value,
                    }))
                  }
                  placeholder="Enter principal name"
                  disabled={creatingPrincipal}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="principal-email"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Email
                </label>

                <input
                  id="principal-email"
                  type="email"
                  required
                  maxLength={320}
                  value={principalForm.email}
                  onChange={(event) =>
                    setPrincipalForm((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                  placeholder="principal@school.com"
                  disabled={creatingPrincipal}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="principal-password"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Temporary Password
                </label>

                <div className="relative">
                  <input
                    id="principal-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={principalForm.password}
                    onChange={(event) =>
                      setPrincipalForm((previous) => ({
                        ...previous,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Minimum 8 characters"
                    disabled={creatingPrincipal}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="principal-school"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  School
                </label>

                <select
                  id="principal-school"
                  required
                  value={principalForm.school_id}
                  onChange={(event) =>
                    setPrincipalForm((previous) => ({
                      ...previous,
                      school_id: event.target.value,
                    }))
                  }
                  disabled={creatingPrincipal}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                >
                  <option value="">Select a school</option>

                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name} — {school.id}
                    </option>
                  ))}
                </select>

                {schools.length === 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    No schools are registered. Add a school before creating a
                    principal.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPrincipalModal(false)}
                  disabled={creatingPrincipal}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingPrincipal || schools.length === 0}
                  className="flex min-w-[150px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingPrincipal ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create Principal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsPage;
