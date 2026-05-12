from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.rol.nombre_rol == 'SU')

class IsDataEntry(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.rol.nombre_rol == 'DE')
    
class IsLegales(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.rol.nombre_rol == 'LG')
    
class IsTrabajadoraSocial(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_athenticated and request.user.rol.nombre_rol == 'TS')