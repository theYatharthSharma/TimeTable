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
  // -----------------------------
  // Data
  // -----------------------------

  const [principals, setPrincipals] = useState<Principal[]>(
    []
  );

  const [features, setFeatures] = useState<Feature[]>(
    []
  );

  const [schools, setSchools] = useState<School[]>([]);

  const [selectedPrincipal, setSelectedPrincipal] =
    useState<Principal | null>(null);

  const [permissions, setPermissions] =
    useState<PermissionGrant[]>([]);

  // -----------------------------
  // UI state
  // -----------------------------

  const [searchTerm, setSearchTerm] = useState('');

  const [loading, setLoading] = useState(true);

  const [permissionsLoading, setPermissionsLoading] =
    useState(false);

  const [processingFeature, setProcessingFeature] =
    useState<string | null>(null);

  const [error, setError] = useState<string | null>(
    null
  );

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  // -----------------------------
  // Principal modal
  // -----------------------------

  const [showPrincipalModal, setShowPrincipalModal] =
    useState(false);

  const [principalForm, setPrincipalForm] =
    useState<PrincipalForm>(emptyPrincipalForm);

  const [creatingPrincipal, setCreatingPrincipal] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  // -----------------------------
  // Initial loading
  // -----------------------------

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        principalData,
        featureData,
        schoolData,
      ] = await Promise.all([
        getPrincipals(),
        getFeatures(),
        getSchools(),
      ]);

      setPrincipals(principalData);
      setFeatures(featureData);
      setSchools(schoolData);

      if (principalData.length > 0) {
        setSelectedPrincipal(principalData[0]);
      }
    } catch (err) {
      console.error(
        'Failed to load permission data:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load permission management data.'
      );
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Principal permissions
  // -----------------------------

  useEffect(() => {
    if (!selectedPrincipal) {
      setPermissions([]);
      return;
    }

    loadPrincipalPermissions(
      selectedPrincipal.id
    );
  }, [selectedPrincipal]);

  const loadPrincipalPermissions = async (
    principalId: string
  ) => {
    try {
      setPermissionsLoading(true);
      setError(null);

      const data =
        await getUserPermissions(principalId);

      setPermissions(data);
    } catch (err) {
      console.error(
        'Failed to load permissions:',
        err
      );

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

  // -----------------------------
  // Permission map
  // -----------------------------

  const permissionMap = useMemo<PermissionState>(
    () => {
      const map: PermissionState = {};

      permissions.forEach((permission) => {
        if (permission.is_active) {
          map[permission.feature_code] = true;
        }
      });

      return map;
    },
    [permissions]
  );

  // -----------------------------
  // Principal search
  // -----------------------------

  const filteredPrincipals = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    if (!query) {
      return principals;
    }

    return principals.filter(
      (principal) =>
        principal.full_name
          .toLowerCase()
          .includes(query) ||
        principal.email
          .toLowerCase()
          .includes(query)
    );
  }, [principals, searchTerm]);

  // -----------------------------
  // Feature grouping
  // -----------------------------

  const groupedFeatures = useMemo(() => {
    return features.reduce<
      Record<string, Feature[]>
    >((groups, feature) => {
      const category =
        feature.category || 'Other';

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(feature);

      return groups;
    }, {});
  }, [features]);

  // -----------------------------
  // Find grant
  // -----------------------------

  const getGrantForFeature = (
    featureCode: string
  ): PermissionGrant | undefined => {
    return permissions.find(
      (permission) =>
        permission.feature_code === featureCode &&
        permission.is_active
    );
  };

  // -----------------------------
  // Grant / revoke
  // -----------------------------

  const handlePermissionToggle = async (
    feature: Feature
  ) => {
    if (!selectedPrincipal) {
      return;
    }

    const currentlyGranted =
      permissionMap[feature.code] === true;

    try {
      setProcessingFeature(feature.code);
      setError(null);
      setSuccessMessage(null);

      if (currentlyGranted) {
        const grant =
          getGrantForFeature(feature.code);

        if (!grant) {
          throw new Error(
            'Permission grant could not be found.'
          );
        }

        await revokePermission(grant.id);

        setPermissions((previous) =>
          previous.map((permission) =>
            permission.id === grant.id
              ? {
                  ...permission,
                  is_active: false,
                  revoked_at:
                    new Date().toISOString(),
                }
              : permission
          )
        );

        setSuccessMessage(
          `${feature.name} access revoked from ${selectedPrincipal.full_name}.`
        );
      } else {
        const newGrant =
          await grantPermission(
            selectedPrincipal.id,
            feature.code
          );

        setPermissions((previous) => [
          ...previous.filter(
            (permission) =>
              !(
                permission.feature_code ===
                  feature.code &&
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
      console.error(
        'Permission update failed:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update permission.'
      );
    } finally {
      setProcessingFeature(null);
    }
  };

  // -----------------------------
  // Create principal
  // -----------------------------

  const handleCreatePrincipal = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setError(null);
    setSuccessMessage(null);

    const fullName =
      principalForm.full_name.trim();

    const email =
      principalForm.email.trim();

    const password =
      principalForm.password;

    const schoolId =
      principalForm.school_id;

    if (!fullName) {
      setError(
        'Please enter the principal name.'
      );
      return;
    }

    if (!email) {
      setError(
        'Please enter the principal email.'
      );
      return;
    }

    if (!password) {
      setError(
        'Please enter a password.'
      );
      return;
    }

    if (password.length < 8) {
      setError(
        'Password must be at least 8 characters.'
      );
      return;
    }

    if (!schoolId) {
      setError(
        'Please select a school.'
      );
      return;
    }

    try {
      setCreatingPrincipal(true);

      const newPrincipal =
        await createPrincipal({
          full_name: fullName,
          email,
          password,
          school_id: schoolId,
        });

      // Add principal to current list.
      setPrincipals((previous) => [
        ...previous,
        newPrincipal,
      ]);

      // Select newly created principal.
      setSelectedPrincipal(newPrincipal);

      // Reset form.
      setPrincipalForm(
        emptyPrincipalForm
      );

      setShowPrincipalModal(false);

      setSuccessMessage(
        `${newPrincipal.full_name} was created successfully.`
      );
    } catch (err) {
      console.error(
        'Failed to create principal:',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create principal.'
      );
    } finally {
      setCreatingPrincipal(false);
    }
  };

  // -----------------------------
  // Refresh
  // -----------------------------

  const handleRefresh = async () => {
    try {
      setError(null);
      setSuccessMessage(null);

      const principalData =
        await getPrincipals();

      setPrincipals(principalData);

      if (selectedPrincipal) {
        const updated =
          principalData.find(
            (principal) =>
              principal.id ===
              selectedPrincipal.id
          );

        if (updated) {
          setSelectedPrincipal(updated);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to refresh principals.'
      );
    }
  };

  // -----------------------------
  // Loading screen
  // -----------------------------

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />

          <span>
            Loading permission management...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
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
        </div>

        <div className="flex gap-2">

          <button
            type="button"
            onClick={() =>
              setShowPrincipalModal(true)
            }
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />

            Add Principal
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={permissionsLoading}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Refresh
          </button>

        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">

          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div>
            <p className="font-medium">
              Something went wrong
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setError(null)
            }
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">

          <Check className="mt-0.5 h-5 w-5" />

          <p className="text-sm font-medium">
            {successMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage(null)
            }
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">

        {/* Principals */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-4">

            <div className="mb-3 flex items-center gap-2">

              <UserCog className="h-5 w-5 text-gray-600" />

              <h2 className="font-semibold text-gray-900">
                Principals
              </h2>

              <span className="ml-auto rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {principals.length}
              </span>

            </div>

            <div className="relative">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                type="text"
                placeholder="Search principals..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

          <div className="max-h-[600px] overflow-y-auto p-2">

            {filteredPrincipals.length === 0 ? (
              <div className="p-8 text-center">

                <UserCog className="mx-auto h-10 w-10 text-gray-300" />

                <p className="mt-3 font-medium text-gray-700">
                  No principals found
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Create a principal account to manage access.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setShowPrincipalModal(true)
                  }
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Principal
                </button>

              </div>
            ) : (
              filteredPrincipals.map(
                (principal) => {

                  const isSelected =
                    selectedPrincipal?.id ===
                    principal.id;

                  return (
                    <button
                      key={principal.id}
                      type="button"
                      onClick={() => {
                        setSelectedPrincipal(
                          principal
                        );

                        setSuccessMessage(
                          null
                        );

                        setError(null);
                      }}
                      className={`mb-1 w-full rounded-lg p-3 text-left transition ${
                        isSelected
                          ? 'bg-blue-50 ring-1 ring-blue-200'
                          : 'hover:bg-gray-50'
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                          {principal.full_name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate font-medium text-gray-900">
                            {principal.full_name}
                          </p>

                          <p className="truncate text-xs text-gray-500">
                            {principal.email}
                          </p>

                        </div>

                        {isSelected && (
                          <Check className="ml-auto h-5 w-5 shrink-0 text-blue-600" />
                        )}

                      </div>

                    </button>
                  );
                }
              )
            )}

          </div>
        </div>

        {/* Feature permissions */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 p-5">

            {selectedPrincipal ? (
              <div>

                <p className="text-sm text-gray-500">
                  Managing access for
                </p>

                <h2 className="mt-1 text-xl font-semibold text-gray-900">
                  {selectedPrincipal.full_name}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedPrincipal.email}
                </p>

              </div>
            ) : (
              <div>

                <h2 className="text-xl font-semibold text-gray-900">
                  Feature Permissions
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Select a principal to manage access.
                </p>

              </div>
            )}

          </div>

          {!selectedPrincipal ? (
            <div className="flex min-h-[400px] items-center justify-center p-6 text-center">

              <div>

                <Shield className="mx-auto h-12 w-12 text-gray-300" />

                <p className="mt-4 font-medium text-gray-700">
                  Select a principal
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Choose a principal from the left to manage their feature access.
                </p>

              </div>

            </div>
          ) : permissionsLoading ? (
            <div className="flex min-h-[400px] items-center justify-center">

              <div className="flex items-center gap-3 text-gray-600">

                <Loader2 className="h-5 w-5 animate-spin" />

                <span>
                  Loading permissions...
                </span>

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

              {Object.entries(
                groupedFeatures
              ).map(
                ([
                  category,
                  categoryFeatures,
                ]) => (
                  <div key={category}>

                    <div className="mb-3">

                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        {category}
                      </h3>

                    </div>

                    <div className="space-y-3">

                      {categoryFeatures.map(
                        (feature) => {

                          const enabled =
                            permissionMap[
                              feature.code
                            ] === true;

                          const processing =
                            processingFeature ===
                            feature.code;

                          return (
                            <div
                              key={feature.code}
                              className={`flex items-center justify-between rounded-xl border p-4 transition ${
                                enabled
                                  ? 'border-green-200 bg-green-50/50'
                                  : 'border-gray-200 bg-white'
                              }`}
                            >

                              <div className="min-w-0 pr-4">

                                <div className="flex items-center gap-2">

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

                                <p className="mt-2 font-mono text-xs text-gray-400">
                                  {feature.code}
                                </p>

                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handlePermissionToggle(
                                    feature
                                  )
                                }
                                disabled={processing}
                                className={`flex min-w-[110px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
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
                        }
                      )}

                    </div>
                  </div>
                )
              )}

            </div>
          )}

        </div>
      </div>

      {/* ========================= */}
      {/* Add Principal Modal */}
      {/* ========================= */}

      {showPrincipalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* Modal header */}
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
                onClick={() => {
                  if (!creatingPrincipal) {
                    setShowPrincipalModal(
                      false
                    );
                  }
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* Form */}
            <form
              onSubmit={
                handleCreatePrincipal
              }
              className="space-y-5 p-5"
            >

              {/* Name */}
              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={
                    principalForm.full_name
                  }
                  onChange={(event) =>
                    setPrincipalForm(
                      (previous) => ({
                        ...previous,
                        full_name:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Enter principal name"
                  disabled={
                    creatingPrincipal
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

              </div>

              {/* Email */}
              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>

                <input
                  type="email"
                  value={
                    principalForm.email
                  }
                  onChange={(event) =>
                    setPrincipalForm(
                      (previous) => ({
                        ...previous,
                        email:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="principal@school.com"
                  disabled={
                    creatingPrincipal
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                />

              </div>

              {/* Password */}
              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Temporary Password
                </label>

                <div className="relative">

                  <input
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      principalForm.password
                    }
                    onChange={(event) =>
                      setPrincipalForm(
                        (previous) => ({
                          ...previous,
                          password:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Minimum 8 characters"
                    disabled={
                      creatingPrincipal
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) =>
                          !previous
                      )
                    }
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

              {/* School */}
              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  School
                </label>

                <select
                  value={
                    principalForm.school_id
                  }
                  onChange={(event) =>
                    setPrincipalForm(
                      (previous) => ({
                        ...previous,
                        school_id:
                          event.target.value,
                      })
                    )
                  }
                  disabled={
                    creatingPrincipal
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                >
                  <option value="">
                    Select a school
                  </option>

                  {schools.map((school) => (
                    <option
                      key={school.id}
                      value={school.id}
                    >
                      {school.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">

                <button
                  type="button"
                  onClick={() => {
                    if (!creatingPrincipal) {
                      setShowPrincipalModal(
                        false
                      );
                    }
                  }}
                  disabled={
                    creatingPrincipal
                  }
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingPrincipal
                  }
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