from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.usuario.rol.nombre_rol == 'SU')

class IsDataEntry(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.usuario.rol.nombre_rol == 'DE')
    
class IsLegales(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.usuario.rol.nombre_rol == 'LG')
    
class IsTrabajadoraSocial(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.usuario.rol.nombre_rol == 'TS')

class IsAnyRole(BasePermission):
    def has_permission(self, request, view):
        return True# bool(request.user and request.user.is_authenticated and hasattr(request.user, 'usuario'))
    
class IsDataEntryOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return True#bool(
        #     request.user and 
        #     request.user.is_authenticated and
        #     request.user.usuario.rol.nombre_rol in ['DE', 'SU']
        # )